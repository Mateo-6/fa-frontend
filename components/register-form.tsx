"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrength } from "@/components/ui/password-strength";
import { register as registerUser, login, RegisterData } from "@/lib/api";
import { getPasswordRuleChecks } from "@/lib/password";
import { saveSession } from "@/lib/session";
import { Loader2, UserPlus } from "lucide-react";

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
  acceptTerms: boolean;
}

const INITIAL_DATA: RegisterFormData = {
  username: "",
  name: "",
  email: "",
  password: "",
  phone: "",
  confirmPassword: "",
  acceptTerms: false,
};

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = React.useState<RegisterFormData>(INITIAL_DATA);
  const [errors, setErrors] = React.useState<Partial<Record<keyof RegisterData | "confirmPassword" | "acceptTerms", string>>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof RegisterData | "confirmPassword" | "acceptTerms", string>> = {};

    if (!formData.username.trim()) {
      nextErrors.username = "El nombre de usuario es obligatorio";
    } else if (formData.username.length > 100) {
      nextErrors.username = "Debe tener menos de 100 caracteres";
    }

    if (!formData.name.trim()) {
      nextErrors.name = "El nombre completo es obligatorio";
    } else if (formData.name.length > 100) {
      nextErrors.name = "Debe tener menos de 100 caracteres";
    }

    if (!formData.email) {
      nextErrors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Formato de correo inválido";
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = "El teléfono es obligatorio";
    }

    if (!formData.password) {
      nextErrors.password = "La contraseña es obligatoria";
    } else {
      const unmetRule = getPasswordRuleChecks(formData.password).find((rule) => !rule.satisfied);
      if (unmetRule) nextErrors.password = unmetRule.errorMessage;
    }

    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (!formData.acceptTerms) {
      nextErrors.acceptTerms = "Debes aceptar los términos";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field: keyof RegisterFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === "acceptTerms" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
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
      const { confirmPassword, acceptTerms, ...registerPayload } = formData;
      await registerUser(registerPayload);

      const session = await login({ email: formData.email, password: formData.password });
      saveSession(session, true);

      router.push("/summary");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear la cuenta";
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Input
        label="Nombre de usuario"
        type="text"
        name="username"
        autoComplete="username"
        placeholder="johndoe"
        value={formData.username}
        onChange={handleChange("username")}
        error={errors.username}
        disabled={isLoading}
      />

      <Input
        label="Nombre completo"
        type="text"
        name="name"
        autoComplete="name"
        placeholder="John Doe"
        value={formData.name}
        onChange={handleChange("name")}
        error={errors.name}
        disabled={isLoading}
      />

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
        label="Teléfono"
        type="tel"
        name="phone"
        autoComplete="tel"
        placeholder="+1 234 567 890"
        value={formData.phone}
        onChange={handleChange("phone")}
        error={errors.phone}
        disabled={isLoading}
      />

      <Input
        label="Contraseña"
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange("password")}
        onFocus={() => setPasswordFocused(true)}
        onBlur={() => setPasswordFocused(false)}
        error={errors.password}
        disabled={isLoading}
      />

      <PasswordStrength password={formData.password} focused={passwordFocused} />

      <Input
        label="Confirmar contraseña"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={handleChange("confirmPassword")}
        error={errors.confirmPassword}
        disabled={isLoading}
      />

      <div
        className="flex flex-col gap-2"
      >
        <label className="flex items-start gap-2 text-sm text-ink-muted cursor-pointer hover:text-ink transition-colors">
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={handleChange("acceptTerms")}
            disabled={isLoading}
            className="mt-0.5 h-4 w-4 rounded border-glass-border bg-ground/60 text-accent focus:ring-accent/60"
          />
          <span>
            Acepto los{" "}
            <a href="#" className="text-accent hover:brightness-110 transition-colors">
              términos y condiciones
            </a>
            {" "}y la{" "}
            <a href="#" className="text-accent hover:brightness-110 transition-colors">
              política de privacidad
            </a>
            .
          </span>
        </label>
        {errors.acceptTerms && (
          <span className="text-xs text-danger" role="alert">
            {errors.acceptTerms}
          </span>
        )}
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
            Creando cuenta...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Crear cuenta
          </>
        )}
      </Button>
    </form>
  );
}
