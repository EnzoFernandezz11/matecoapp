"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/use-auth";
import { UNIVERSITY_ONBOARDING_SKIP_KEY } from "@/features/university/constants";
import { useCreateUniversity, useUniversitySearch, useUpdateMyUniversity } from "@/features/university/hooks";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export default function UniversityOnboardingPage() {
  const router = useRouter();
  const { user, token, setAuth } = useAuth();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const search = useUniversitySearch(debouncedQuery);
  const createUniversity = useCreateUniversity();
  const updateMyUniversity = useUpdateMyUniversity();

  useEffect(() => {
    if (user?.university_id) {
      router.replace("/inicio");
    }
  }, [user?.university_id, router]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const exactMatch = useMemo(() => {
    const q = normalize(query);
    return search.data?.find((u) => normalize(u.name) === q);
  }, [query, search.data]);
  const hasResults = (search.data?.length ?? 0) > 0;
  const canShowCreate =
    query.trim().length >= 2 &&
    !search.isFetching &&
    !search.isLoading &&
    !hasResults &&
    !exactMatch;

  const handleSelect = async (universityId: string) => {
    if (!token) {
      return;
    }
    setError(null);
    try {
      const updatedUser = await updateMyUniversity.mutateAsync(universityId);
      localStorage.removeItem(UNIVERSITY_ONBOARDING_SKIP_KEY);
      setAuth(token, updatedUser);
      router.replace("/inicio");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la universidad");
    }
  };

  const handleCreate = async () => {
    if (!query.trim()) {
      return;
    }
    setError(null);
    try {
      const university = await createUniversity.mutateAsync(query.trim());
      await handleSelect(university.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la universidad");
    }
  };

  const handleSkip = () => {
    localStorage.setItem(UNIVERSITY_ONBOARDING_SKIP_KEY, "1");
    router.replace("/inicio");
  };

  const isBusy = createUniversity.isPending || updateMyUniversity.isPending;

  return (
    <div className="pt-8">
      <Card>
        <h1 className="text-xl font-extrabold text-zinc-900">De que universidad sos? (opcional)</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Esto nos ayuda a agrupar rondas y rankings por universidad.
        </p>

        <Input
          className="mt-4"
          placeholder="Buscar universidad..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="mt-3 space-y-2">
          {search.isFetching ? <p className="text-xs text-zinc-500">Buscando universidades...</p> : null}

          {search.data?.map((university) => (
            <button
              key={university.id}
              className="w-full rounded-xl border border-mateco-border bg-mateco-surface px-3 py-2 text-left text-sm text-zinc-800 transition hover:bg-mateco-surfaceAlt"
              onClick={() => handleSelect(university.id)}
              disabled={isBusy}
            >
              {university.name}
              {university.city ? <span className="ml-1 text-zinc-500">- {university.city}</span> : null}
            </button>
          ))}

          {search.isError ? (
            <p className="text-xs text-red-600">
              No se pudo buscar universidades. Proba de nuevo en unos segundos.
            </p>
          ) : null}

          {canShowCreate ? (
            <Button variant="outline" onClick={handleCreate} disabled={isBusy}>
              {createUniversity.isPending ? `Creando "${query.trim()}"...` : `Crear "${query.trim()}"`}
            </Button>
          ) : null}
        </div>

        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

        <Button className="mt-4" variant="ghost" onClick={handleSkip} disabled={isBusy}>
          Omitir por ahora
        </Button>
      </Card>
    </div>
  );
}
