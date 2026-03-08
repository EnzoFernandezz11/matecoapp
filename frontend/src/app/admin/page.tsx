"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import {
  adminHealth,
  adminMetrics,
  adminRounds,
  adminTurns,
  adminUsers,
  type AdminMetrics,
  type AdminRoundRow,
  type AdminTurnRow,
  type AdminUserRow,
} from "@/lib/api/admin";

type Section = "dashboard" | "users" | "rounds" | "turns";

const STORAGE_KEY = "mateco_admin_basic_token";

function encodeBasic(username: string, password: string) {
  return btoa(`${username}:${password}`);
}

export default function AdminPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [basicToken, setBasicToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [section, setSection] = useState<Section>("dashboard");
  const [query, setQuery] = useState("");
  const [turnStatus, setTurnStatus] = useState<"" | "pending" | "completed" | "missed">("");

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [rounds, setRounds] = useState<AdminRoundRow[]>([]);
  const [turns, setTurns] = useState<AdminTurnRow[]>([]);
  const [loadingSection, setLoadingSection] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setBasicToken(saved);
    }
  }, []);

  const loadSection = useCallback(
    async (token: string, currentSection: Section, currentQuery: string, currentStatus: typeof turnStatus) => {
      setLoadingSection(true);
      setSectionError(null);
      try {
        if (currentSection === "dashboard") {
          setMetrics(await adminMetrics(token));
        } else if (currentSection === "users") {
          const data = await adminUsers(token, currentQuery);
          setUsers(data.items);
        } else if (currentSection === "rounds") {
          const data = await adminRounds(token, currentQuery);
          setRounds(data.items);
        } else {
          const data = await adminTurns(token, currentQuery, currentStatus);
          setTurns(data.items);
        }
      } catch (e) {
        setSectionError(e instanceof Error ? e.message : "No se pudo cargar la seccion");
      } finally {
        setLoadingSection(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!basicToken) {
      return;
    }
    void loadSection(basicToken, section, query, turnStatus);
  }, [basicToken, section, query, turnStatus, loadSection]);

  const handleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const token = encodeBasic(username.trim(), password);
      await adminHealth(token);
      setBasicToken(token);
      sessionStorage.setItem(STORAGE_KEY, token);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Credenciales invalidas");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setBasicToken(null);
    setUsername("");
    setPassword("");
  };

  const completionRate = useMemo(() => {
    if (!metrics || metrics.total_turns === 0) {
      return 0;
    }
    return Math.round((metrics.completed_turns / metrics.total_turns) * 100);
  }, [metrics]);

  if (!basicToken) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-md bg-mateco-bg px-4 pt-8">
        <Card>
          <h1 className="text-xl font-extrabold text-zinc-900">Admin MatecoApp</h1>
          <p className="mt-1 text-sm text-zinc-600">Acceso interno con usuario y clave admin.</p>
          <Input className="mt-4" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input
            className="mt-2"
            type="password"
            placeholder="Clave"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="mt-4" onClick={handleLogin} disabled={authLoading || !username || !password}>
            {authLoading ? "Ingresando..." : "Entrar al panel"}
          </Button>
          {authError ? <p className="mt-2 text-xs text-red-600">{authError}</p> : null}
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-mateco-bg px-4 py-4">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <Card className="h-fit">
          <p className="text-sm font-bold text-zinc-900">Admin Panel</p>
          <div className="mt-3 space-y-2">
            <Button variant={section === "dashboard" ? "primary" : "outline"} size="sm" onClick={() => setSection("dashboard")}>
              Dashboard
            </Button>
            <Button variant={section === "users" ? "primary" : "outline"} size="sm" onClick={() => setSection("users")}>
              Users
            </Button>
            <Button variant={section === "rounds" ? "primary" : "outline"} size="sm" onClick={() => setSection("rounds")}>
              Rounds
            </Button>
            <Button variant={section === "turns" ? "primary" : "outline"} size="sm" onClick={() => setSection("turns")}>
              Turns
            </Button>
          </div>
          <Button className="mt-4" variant="ghost" size="sm" onClick={handleLogout}>
            Cerrar admin
          </Button>
        </Card>

        <div>
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="max-w-sm"
                placeholder="Buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {section === "turns" ? (
                <select
                  className="h-11 rounded-xl border border-mateco-border bg-mateco-surface px-3 text-sm"
                  value={turnStatus}
                  onChange={(e) => setTurnStatus(e.target.value as typeof turnStatus)}
                >
                  <option value="">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="completed">Completado</option>
                  <option value="missed">Faltado</option>
                </select>
              ) : null}
            </div>
          </Card>

          <Card className="mt-3">
            {loadingSection ? <LoadingSkeleton className="h-24 w-full" /> : null}
            {sectionError ? <p className="text-sm text-red-600">{sectionError}</p> : null}

            {!loadingSection && !sectionError && section === "dashboard" ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard label="Total usuarios" value={metrics?.total_users ?? 0} />
                <MetricCard label="Total rondas" value={metrics?.total_rounds ?? 0} />
                <MetricCard label="Total turnos" value={metrics?.total_turns ?? 0} />
                <MetricCard label="Turnos completados" value={metrics?.completed_turns ?? 0} />
                <MetricCard label="Turnos faltados" value={metrics?.skipped_turns ?? 0} />
                <MetricCard label="Tasa cumplimiento" value={`${completionRate}%`} />
              </div>
            ) : null}

            {!loadingSection && !sectionError && section === "users" ? (
              <SimpleTable
                headers={["Nombre", "Email", "Universidad", "Rondas", "Cumplidos", "Faltados"]}
                rows={users.map((u) => [
                  u.name,
                  u.email,
                  u.university ?? "-",
                  String(u.rounds_joined),
                  String(u.turns_completed),
                  String(u.turns_skipped),
                ])}
              />
            ) : null}

            {!loadingSection && !sectionError && section === "rounds" ? (
              <SimpleTable
                headers={["Ronda", "Creador", "Codigo", "Miembros", "Turno actual"]}
                rows={rounds.map((r) => [
                  r.name,
                  r.creator_name ?? "-",
                  r.invite_code,
                  String(r.member_count),
                  r.current_turn_user ?? "-",
                ])}
              />
            ) : null}

            {!loadingSection && !sectionError && section === "turns" ? (
              <SimpleTable
                headers={["Ronda", "Usuario", "Estado", "Indice", "Excusa", "Fecha"]}
                rows={turns.map((t) => [
                  t.round_name ?? "-",
                  t.user_name ?? "-",
                  t.status,
                  String(t.turn_index),
                  t.excuse ?? "-",
                  new Date(t.created_at).toLocaleString(),
                ])}
              />
            ) : null}
          </Card>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-mateco-border bg-mateco-surfaceAlt p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-zinc-900">{value}</p>
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="border-b border-mateco-border px-2 py-2 text-left text-xs text-zinc-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, cidx) => (
                <td key={`${idx}-${cidx}`} className="border-b border-mateco-border px-2 py-2 text-zinc-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td className="px-2 py-4 text-zinc-500" colSpan={headers.length}>
                Sin resultados
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
