"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createUniversity,
  searchUniversities,
  updateMyUniversity,
} from "@/lib/api/endpoints";
import type { University } from "@/lib/api/types";
import { useAuth } from "@/features/auth/use-auth";

const MIN_QUERY_LENGTH = 2;

export function UniversityOnboarding() {
  const { token, user, setAuth } = useAuth();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldShow = useMemo(() => {
    if (!token || !user) return false;
    if (user.university_id) return false;
    return true;
  }, [token, user]);

  useEffect(() => {
    if (!shouldShow || !token) {
      return;
    }
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchUniversities(token, query.trim())
        .then((res) => setOptions(res.items))
        .catch(() => setError("No pudimos buscar universidades."))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, shouldShow, token]);

  if (!shouldShow || !token || !user) {
    return null;
  }

  const handleSelect = async (universityId: string) => {
    try {
      setSaving(true);
      setError(null);
      const updatedUser = await updateMyUniversity(token, universityId);
      setAuth(token, updatedUser);
    } catch {
      setError("No se pudo guardar la universidad.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const clean = query.trim();
    if (clean.length < 3) {
      setError("Escribi al menos 3 caracteres para crear.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const created = await createUniversity(token, { name: clean, country_code: "AR" });
      if (!created.created || !created.university) {
        if (created.possible_duplicates.length > 0) {
          setOptions(created.possible_duplicates);
          setError("Encontramos posibles duplicados. Elegi uno de la lista.");
          return;
        }
        setError("No se pudo crear la universidad.");
        return;
      }
      const updatedUser = await updateMyUniversity(token, created.university.id);
      setAuth(token, updatedUser);
    } catch {
      setError("No se pudo crear la universidad.");
    } finally {
      setSaving(false);
    }
  };

  const canCreate = query.trim().length >= 3;
  const showCreate = canCreate && options.length === 0 && !loading;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <Card className="w-full max-w-lg border-2 border-mateco-primary/20 bg-white">
        <h2 className="text-xl font-extrabold text-zinc-900">Elegi tu universidad</h2>
        <p className="mt-1 text-sm text-zinc-600">Para continuar, selecciona una existente o crea una nueva.</p>

        <div className="mt-3">
          <Input
            placeholder="Escribi universidad o sede"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={saving}
            autoFocus
          />
        </div>

        <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50">
          {loading ? <p className="p-3 text-sm text-zinc-500">Buscando...</p> : null}
          {!loading && options.length === 0 && query.trim().length < MIN_QUERY_LENGTH ? (
            <p className="p-3 text-sm text-zinc-500">Escribi al menos 2 caracteres.</p>
          ) : null}
          {!loading && options.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => handleSelect(item.id)}
              disabled={saving}
              className="w-full border-b border-zinc-200 px-3 py-2 text-left text-sm text-zinc-800 last:border-b-0 hover:bg-zinc-100"
            >
              <span className="font-semibold">{item.name}</span>
              {item.city ? <span className="ml-2 text-zinc-500">{item.city}</span> : null}
            </button>
          ))}
          {!loading && showCreate ? (
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="w-full px-3 py-2 text-left text-sm font-semibold text-mateco-primary hover:bg-zinc-100"
            >
              Crear "{query.trim()}"
            </button>
          ) : null}
        </div>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </Card>
    </div>
  );
}
