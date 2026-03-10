import logging
import random
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
import sqlalchemy as sa
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.penalty_vote import (
    DEFAULT_PENALTY,
    PENALTY_OPTIONS,
    PenaltyVote,
    PenaltyVoteOption,
    PenaltyVoteStatus,
    UserPenaltyVote,
)
from app.models.round_member import RoundMember
from app.schemas.vote_schema import PenaltyVoteOptionResponse, PenaltyVoteResponse

logger = logging.getLogger(__name__)

VOTE_DURATION_HOURS = 24


def _get_vote_query():
    return select(PenaltyVote).options(
        joinedload(PenaltyVote.options),
        joinedload(PenaltyVote.user_votes),
        joinedload(PenaltyVote.failed_user),
    )


def _build_vote_response(vote: PenaltyVote, current_user_id: UUID) -> PenaltyVoteResponse:
    user_has_voted = any(uv.user_id == current_user_id for uv in vote.user_votes)
    return PenaltyVoteResponse(
        id=vote.id,
        round_id=vote.round_id,
        failed_user_id=vote.failed_user_id,
        failed_user_name=vote.failed_user.name,
        turn_id=vote.turn_id,
        created_at=vote.created_at,
        expires_at=vote.expires_at,
        status=vote.status.value,
        winning_penalty=vote.winning_penalty,
        options=[
            PenaltyVoteOptionResponse(
                id=opt.id,
                penalty_name=opt.penalty_name,
                vote_count=opt.vote_count,
            )
            for opt in sorted(vote.options, key=lambda o: o.penalty_name)
        ],
        user_has_voted=user_has_voted,
    )


def create_vote_session(
    db: Session,
    round_id: UUID,
    failed_user_id: UUID,
    turn_id: UUID | None = None,
) -> PenaltyVote:
    existing = db.scalar(
        select(PenaltyVote).where(
            PenaltyVote.round_id == round_id,
            PenaltyVote.failed_user_id == failed_user_id,
            PenaltyVote.status == PenaltyVoteStatus.active,
        )
    )
    if existing is not None:
        return existing

    now = datetime.now(timezone.utc)
    vote = PenaltyVote(
        round_id=round_id,
        failed_user_id=failed_user_id,
        turn_id=turn_id,
        expires_at=now + timedelta(hours=VOTE_DURATION_HOURS),
        status=PenaltyVoteStatus.active,
    )
    db.add(vote)
    db.flush()

    for option_name in PENALTY_OPTIONS:
        option = PenaltyVoteOption(
            vote_id=vote.id,
            penalty_name=option_name,
            vote_count=0,
        )
        db.add(option)

    db.flush()
    logger.info(
        "Vote session created vote_id=%s round_id=%s failed_user_id=%s",
        vote.id, round_id, failed_user_id,
    )
    return vote


def get_active_vote(db: Session, round_id: UUID, current_user_id: UUID) -> PenaltyVoteResponse | None:
    _auto_close_expired(db, round_id)

    stmt = (
        _get_vote_query()
        .where(
            PenaltyVote.round_id == round_id,
            PenaltyVote.status == PenaltyVoteStatus.active,
        )
        .order_by(PenaltyVote.created_at.desc())
    )
    vote = db.scalars(stmt).unique().first()
    if vote is None:
        return None
    return _build_vote_response(vote, current_user_id)


def get_latest_closed_vote(db: Session, round_id: UUID, current_user_id: UUID) -> PenaltyVoteResponse | None:
    stmt = (
        _get_vote_query()
        .where(
            PenaltyVote.round_id == round_id,
            PenaltyVote.status == PenaltyVoteStatus.closed,
        )
        .order_by(PenaltyVote.created_at.desc())
    )
    vote = db.scalars(stmt).unique().first()
    if vote is None:
        return None
    return _build_vote_response(vote, current_user_id)


def submit_vote(
    db: Session,
    vote_id: UUID,
    user_id: UUID,
    penalty_option_id: UUID,
) -> PenaltyVoteResponse:
    stmt = _get_vote_query().where(PenaltyVote.id == vote_id)
    vote = db.scalars(stmt).unique().first()
    if vote is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vote session not found")

    if vote.status != PenaltyVoteStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voting is closed")

    now = datetime.now(timezone.utc)
    if now >= vote.expires_at:
        _close_vote(db, vote)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voting has expired")

    if vote.failed_user_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The person who failed cannot vote",
        )

    membership = db.scalar(
        select(RoundMember).where(
            RoundMember.round_id == vote.round_id,
            RoundMember.user_id == user_id,
        )
    )
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this round")

    existing_vote = db.scalar(
        select(UserPenaltyVote).where(
            UserPenaltyVote.vote_id == vote_id,
            UserPenaltyVote.user_id == user_id,
        )
    )
    if existing_vote is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already voted")

    option = db.scalar(
        select(PenaltyVoteOption).where(
            PenaltyVoteOption.id == penalty_option_id,
            PenaltyVoteOption.vote_id == vote_id,
        )
    )
    if option is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Option not found")

    user_vote = UserPenaltyVote(
        vote_id=vote_id,
        user_id=user_id,
        penalty_option_id=penalty_option_id,
    )
    db.add(user_vote)
    option.vote_count += 1
    db.flush()

    # Auto-close if all eligible members have voted
    total_members = db.scalar(
        select(sa.func.count()).select_from(RoundMember).where(
            RoundMember.round_id == vote.round_id,
        )
    )
    eligible_voters = total_members - 1  # exclude the failed user
    total_votes_cast = db.scalar(
        select(sa.func.count()).select_from(UserPenaltyVote).where(
            UserPenaltyVote.vote_id == vote_id,
        )
    )
    if eligible_voters > 0 and total_votes_cast >= eligible_voters:
        # Refresh options from DB before closing
        db.refresh(vote)
        for opt in vote.options:
            db.refresh(opt)
        _close_vote(db, vote)
        logger.info("Vote auto-closed (all members voted) vote_id=%s", vote_id)

    db.commit()

    vote = db.scalars(_get_vote_query().where(PenaltyVote.id == vote_id)).unique().one()
    logger.info(
        "Vote submitted vote_id=%s user_id=%s option=%s",
        vote_id, user_id, option.penalty_name,
    )
    return _build_vote_response(vote, user_id)


def _close_vote(db: Session, vote: PenaltyVote) -> None:
    options = sorted(vote.options, key=lambda o: o.vote_count, reverse=True)
    total_votes = sum(o.vote_count for o in options)

    if total_votes == 0:
        vote.winning_penalty = DEFAULT_PENALTY
    else:
        max_count = options[0].vote_count
        tied = [o for o in options if o.vote_count == max_count]
        winner = random.choice(tied)  # noqa: S311
        vote.winning_penalty = winner.penalty_name

    vote.status = PenaltyVoteStatus.closed
    logger.info(
        "Vote closed vote_id=%s winner=%s total_votes=%d",
        vote.id, vote.winning_penalty, total_votes,
    )


def _auto_close_expired(db: Session, round_id: UUID) -> None:
    now = datetime.now(timezone.utc)
    stmt = (
        select(PenaltyVote)
        .options(joinedload(PenaltyVote.options))
        .where(
            PenaltyVote.round_id == round_id,
            PenaltyVote.status == PenaltyVoteStatus.active,
            PenaltyVote.expires_at <= now,
        )
    )
    expired_votes = list(db.scalars(stmt).unique().all())
    for vote in expired_votes:
        _close_vote(db, vote)
    if expired_votes:
        db.commit()


def close_all_expired_votes(db: Session) -> int:
    """Close all expired votes across all rounds. Returns count of closed votes."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(PenaltyVote)
        .options(joinedload(PenaltyVote.options))
        .where(
            PenaltyVote.status == PenaltyVoteStatus.active,
            PenaltyVote.expires_at <= now,
        )
    )
    expired_votes = list(db.scalars(stmt).unique().all())
    for vote in expired_votes:
        _close_vote(db, vote)
    if expired_votes:
        db.commit()
    return len(expired_votes)
