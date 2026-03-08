"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MateIcon } from "@/components/ui/mate-icon";
import { useAuth } from "@/features/auth/use-auth";
import { UNIVERSITY_ONBOARDING_SKIP_KEY } from "@/features/university/constants";
import { ApiError } from "@/lib/api/client";
import { authWithGoogle, loginWithEmail, registerWithEmail } from "@/lib/api/endpoints";

type Mode = "login" | "register";

export default function LoginPage() {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const router = useRouter();
  const { setAuth, token } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const resolvePostLoginPath = (universityId?: string | null) => {
    const skipped = typeof window !== "undefined" && localStorage.getItem(UNIVERSITY_ONBOARDING_SKIP_KEY) === "1";
    if (!universityId && !skipped) {
      return "/onboarding/university";
    }
    return "/inicio";
  };
  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };
  const toFriendlyAuthError = (error: unknown, action: Mode): string => {
    if (!(error instanceof ApiError)) {
      return action === "register" ? "No se pudo crear la cuenta" : "No se pudo iniciar sesion";
    }
    if (error.status === 409) {
      return "Ese email ya esta registrado. Proba iniciar sesion.";
    }
    if (error.status === 401) {
      return "Email o contrasena incorrectos.";
    }
    if (error.status === 422) {
      return "Revisa los datos ingresados y volve a intentar.";
    }
    return error.message;
  };

  useEffect(() => {
    if (token) {
      router.replace("/inicio");
    }
  }, [token, router]);

  useEffect(() => {
    if (!googleLoaded || !googleClientId || !googleButtonRef.current || typeof window === "undefined") {
      return;
    }

    const googleApi = window.google?.accounts?.id;
    if (!googleApi) {
      return;
    }

    googleButtonRef.current.innerHTML = "";
    googleApi.initialize({
      client_id: googleClientId,
      callback: async ({ credential }: { credential?: string }) => {
        if (!credential) {
          setError("No se pudo obtener credencial de Google.");
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const auth = await authWithGoogle(credential);
          setAuth(auth.token, auth.user);
          router.replace(resolvePostLoginPath(auth.user.university_id));
        } catch (err) {
          setError(err instanceof Error ? err.message : "No se pudo iniciar sesion con Google");
        } finally {
          setLoading(false);
        }
      },
    });

    googleApi.renderButton(googleButtonRef.current, {
      type: "standard",
      shape: "pill",
      theme: "outline",
      text: "continue_with",
      size: "large",
      width: 320,
    });
  }, [googleLoaded, googleClientId, router, setAuth]);

  const onEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Ingresa email y contrasena.");
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError("Ingresa un email valido.");
      return;
    }
    if (password.trim().length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Ingresa tu nombre para registrarte.");
      return;
    }
    if (mode === "register" && name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const auth =
        mode === "register"
          ? await registerWithEmail(name.trim(), email.trim(), password)
          : await loginWithEmail(email.trim(), password);
      setAuth(auth.token, auth.user);
      router.replace(resolvePostLoginPath(auth.user.university_id));
    } catch (err) {
      setError(toFriendlyAuthError(err, mode));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleLoaded(true)}
      />
      <Card className="w-full p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mateco-primary/10">
            <MateIcon size={28} />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900">MatecoApp</h1>
          <p className="mt-1 text-sm text-zinc-600">Organiza quien lleva el mate en tu cursada.</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <Button variant={mode === "login" ? "primary" : "secondary"} onClick={() => setMode("login")}>
            Iniciar sesion
          </Button>
          <Button variant={mode === "register" ? "primary" : "secondary"} onClick={() => setMode("register")}>
            Registrarme
          </Button>
        </div>

        {mode === "register" ? (
          <>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Nombre</label>
            <Input
              className="mb-3"
              placeholder="Tu nombre"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </>
        ) : null}

        <label className="mb-2 block text-sm font-medium text-zinc-700">Email</label>
        <Input
          className="mb-3"
          placeholder="tu@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label className="mb-2 block text-sm font-medium text-zinc-700">Contrasena</label>
        <Input
          className="mb-3"
          type="password"
          placeholder="Minimo 8 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button className="mt-1" onClick={onEmailSubmit} disabled={loading}>
          {loading ? "Procesando..." : mode === "register" ? "Crear cuenta" : "Entrar"}
        </Button>

        <div className="my-5 h-px w-full bg-zinc-200" />

        <p className="mb-2 text-sm font-medium text-zinc-700">Google</p>
        {googleClientId ? <div ref={googleButtonRef} className="flex justify-center" /> : null}
        {!googleClientId ? (
          <p className="text-xs text-red-600">
            Falta configurar NEXT_PUBLIC_GOOGLE_CLIENT_ID en .env.local para usar Google.
          </p>
        ) : null}

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <p className="mt-3 text-center text-xs text-zinc-500">
          Puedes registrarte/iniciar sesion con Google o con email y contrasena.
        </p>
      </Card>
    </main>
  );
}
