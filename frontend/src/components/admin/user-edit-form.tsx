"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUserDetail } from "@/lib/api/types";

export function UserEditForm({
  user,
  isSaving,
  onSubmit,
}: {
  user: AdminUserDetail;
  isSaving: boolean;
  onSubmit: (payload: { name: string; email: string }) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await onSubmit({ name, email });
      setSuccess("Usuario actualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el usuario.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="admin-name" className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Nombre</label>
        <Input id="admin-name" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div>
        <label htmlFor="admin-email" className="mb-1 block text-xs font-semibold uppercase text-zinc-500">Email</label>
        <Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {success ? <p className="text-xs text-emerald-700">{success}</p> : null}
      <Button type="submit" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar cambios"}</Button>
    </form>
  );
}
