/**
 * Reglas de contraseña espejadas desde el DTO de creación de usuario del API
 * (api/src/application/dto/user/create-user.dto.ts) para que la validación
 * del frontend coincida con la del backend.
 */
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>=+\-_~`[\]\\;'/]/;

export interface PasswordRule {
  id: "length" | "uppercase" | "number" | "special";
  label: string;
  errorMessage: string;
  met: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "Al menos 8 caracteres",
    errorMessage: "Mínimo 8 caracteres",
    met: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "Una letra mayúscula (A-Z)",
    errorMessage: "Al menos una mayúscula",
    met: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "Un número (0-9)",
    errorMessage: "Al menos un número",
    met: (password) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "Un carácter especial (!, @, #, ...)",
    errorMessage: "Al menos un carácter especial",
    met: (password) => SPECIAL_CHAR_REGEX.test(password),
  },
];

export interface PasswordRuleCheck extends PasswordRule {
  satisfied: boolean;
}

export function getPasswordRuleChecks(password: string): PasswordRuleCheck[] {
  return PASSWORD_RULES.map((rule) => ({ ...rule, satisfied: rule.met(password) }));
}

export const PASSWORD_STRENGTH_LEVELS = [
  { label: "Muy débil", barColor: "bg-danger", textColor: "text-danger" },
  { label: "Débil", barColor: "bg-danger", textColor: "text-danger" },
  { label: "Media", barColor: "bg-accent", textColor: "text-accent" },
  { label: "Fuerte", barColor: "bg-income", textColor: "text-income" },
  { label: "Muy fuerte", barColor: "bg-income", textColor: "text-income" },
] as const;

export function getPasswordStrength(password: string): number {
  return PASSWORD_RULES.filter((rule) => rule.met(password)).length;
}