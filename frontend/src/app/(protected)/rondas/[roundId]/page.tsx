import { redirect } from "next/navigation";

export default function RoundRootPage({ params }: { params: { roundId: string } }) {
  redirect(`/rondas/${params.roundId}/mesa`);
}
