"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login, LoginCredentials } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { Loader2, ShieldCheck } from "lucide-react";

interface LoginFormData extends LoginCredentials {
  rememberMe: boolean;
}

export function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = React.useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = React.useState<Partial<Record<keyof LoginCredentials, string>>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof LoginCredentials, string>> = {};

    if (!formData.email) {
      nextErrors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Formato de correo inválido";
    }

    if (!formData.password) {
      nextErrors.password = "La contraseña es obligatoria";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === "rememberMe" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof LoginCredentials]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await login({ email: formData.email, password: formData.password });

      // Persist session in a single storage; always clear the other to avoid
      // shadowing a fresh token with a stale one.
      saveSession(result, formData.rememberMe);

      router.push("/summary");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Credenciales inválidas";
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Input
        label="Correo electrónico"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="tu@email.com"
        value={formData.email}
        onChange={handleChange("email")}
        error={errors.email}
        disabled={isLoading}
      />

      <Input
        label="Contraseña"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange("password")}
        error={errors.password}
        disabled={isLoading}
      />

      <div
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer hover:text-ink transition-colors">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleChange("rememberMe")}
            disabled={isLoading}
            className="h-4 w-4 rounded border-glass-border bg-ground/60 text-accent focus:ring-accent/60"
          />
          Recordarme
        </label>
        <a
          href="#"
          className="text-sm text-ink-muted hover:text-accent transition-colors sm:text-right"
          tabIndex={-1}
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            Iniciar sesión
          </>
        )}
      </Button>
    </form>
  );
}
