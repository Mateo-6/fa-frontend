"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FormModal } from "@/components/ui/form-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getUser, updateUser, logout, User } from "@/lib/api";
import { updateStoredUser } from "@/lib/session";
import {
  User as UserIcon,
  Mail,
  Phone,
  AtSign,
  Calendar,
  Pencil,
  LogOut,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface ProfileFormData {
  name: string;
  username: string;
  email: string;
  phone: string;
}

function initialsOf(user: User | null): string {
  const source = user?.name || user?.username || user?.email || "U";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function memberSince(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [editOpen, setEditOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<ProfileFormData>({
    name: "",
    username: "",
    email: "",
    phone: "",
  });
  const [fieldErrors, setFieldErrors] = React.useState<Partial<Record<keyof ProfileFormData, string>>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("fa_token") || sessionStorage.getItem("fa_token");
    if (!token) {
      router.push("/");
      return;
    }

    const stored = localStorage.getItem("fa_user") || sessionStorage.getItem("fa_user");
    let userId: string | null = null;
    if (stored) {
      try {
        userId = JSON.parse(stored)?.id ?? null;
      } catch {
        /* ignore malformed storage */
      }
    }

    if (!userId) {
      setError("No pudimos identificar tu cuenta. Inicia sesión nuevamente.");
      setLoading(false);
      return;
    }

    getUser(userId)
      .then((data) => {
        setUser(data);
        setFormData({
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "No se pudieron cargar tus datos";
        setError(message);
        if ((err as Error & { statusCode?: number }).statusCode === 401) {
          router.push("/");
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const openEdit = () => {
    if (!user) return;
    setFormData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setFieldErrors({});
    setServerError(null);
    setEditOpen(true);
  };

  const handleChange = (field: keyof ProfileFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (serverError) setServerError(null);
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (!formData.name.trim()) nextErrors.name = "El nombre es obligatorio";
    if (!formData.username.trim()) nextErrors.username = "El nombre de usuario es obligatorio";
    if (!formData.email.trim()) {
      nextErrors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Formato de correo inválido";
    }
    if (!formData.phone.trim()) nextErrors.phone = "El teléfono es obligatorio";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setServerError(null);

    if (!validate()) return;

    setSaving(true);
    try {
      const updated = await updateUser(user.id, {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      });

      setUser(updated);
      setFormData({
        name: updated.name || "",
        username: updated.username || "",
        email: updated.email || "",
        phone: updated.phone || "",
      });
      updateStoredUser({
        id: updated.id,
        name: updated.name,
        username: updated.username,
        email: updated.email,
        phone: updated.phone,
      });
      setEditOpen(false);
      toast({
        title: "Perfil actualizado",
        description: "Tus datos se guardaron correctamente.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar el perfil";
      setServerError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } catch {
      // logout() always clears the local session; we redirect regardless.
      router.push("/");
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-ink-muted">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm">Cargando tu perfil...</p>
          </div>
        </main>
      </DashboardShell>
    );
  }

  if (error || !user) {
    return (
      <DashboardShell>
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="glass-panel max-w-md rounded-2xl p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-danger" />
            <h2 className="mt-4 text-lg font-semibold text-ink">No pudimos cargar tu perfil</h2>
            <p className="mt-2 text-sm text-ink-muted">{error || "Intenta de nuevo más tarde."}</p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </main>
      </DashboardShell>
    );
  }

  const contactRows = [
    { icon: UserIcon, label: "Nombre", value: user.name || "—" },
    { icon: Mail, label: "Correo electrónico", value: user.email || "—" },
    { icon: Phone, label: "Teléfono", value: user.phone || "—" },
  ];

  const accountRows = [
    { icon: AtSign, label: "Nombre de usuario", value: user.username ? `@${user.username}` : "—" },
    { icon: Calendar, label: "Miembro desde", value: memberSince(user.createdAt) },
  ];

  const renderRows = (rows: typeof contactRows) => (
    <div className="divide-y divide-glass-border">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div key={row.label} className="flex items-center gap-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Icon className="h-4 w-4" />
            </div>
            <span className="flex-1 text-sm text-ink-muted">{row.label}</span>
            <span className="max-w-[55%] truncate text-sm font-medium text-ink">{row.value}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <DashboardShell>
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Mi perfil</h1>
            <p className="text-sm text-ink-muted">Revisa y actualiza tu información personal.</p>
          </div>

          {/* Profile header */}
          <section className="glass-panel rounded-2xl p-6">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent/10 text-2xl font-semibold text-accent ring-1 ring-accent/20">
                {initialsOf(user)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold tracking-tight text-ink">
                  {user.name || "Usuario"}
                </h2>
                <p className="truncate text-sm text-ink-muted">
                  {user.email || (user.username && `@${user.username}`) || "—"}
                </p>
              </div>
              <Button variant="ghost" onClick={openEdit} className="shrink-0">
                <Pencil className="h-4 w-4" />
                <span>Editar</span>
              </Button>
            </div>
          </section>

          {/* Contact info */}
          <section className="glass-panel rounded-2xl p-6">
            <h2 className="mb-2 text-base font-semibold tracking-tight text-ink">Datos de contacto</h2>
            <p className="mb-2 text-sm text-ink-muted">Cómo contactarte y tu nombre.</p>
            {renderRows(contactRows)}
          </section>

          {/* Account */}
          <section className="glass-panel rounded-2xl p-6">
            <h2 className="mb-2 text-base font-semibold tracking-tight text-ink">Cuenta</h2>
            <p className="mb-2 text-sm text-ink-muted">Tu identificación dentro de Financial App.</p>
            {renderRows(accountRows)}
          </section>

          {/* Actions */}
          <section className="glass-panel rounded-2xl p-2">
            <button
              type="button"
              onClick={openEdit}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-ink transition-colors hover:bg-glass-hover"
            >
              <Pencil className="h-4 w-4 text-accent" />
              <span>Editar perfil</span>
            </button>
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-danger transition-colors hover:bg-glass-hover"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </section>
        </div>
      </main>

      {/* Edit profile modal */}
      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar perfil"
        description="Actualiza los campos que quieras modificar."
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4" noValidate>
          <Input
            label="Nombre"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Tu nombre completo"
            value={formData.name}
            onChange={handleChange("name")}
            error={fieldErrors.name}
            disabled={saving}
          />
          <Input
            label="Nombre de usuario"
            type="text"
            name="username"
            autoComplete="username"
            placeholder="tu_usuario"
            value={formData.username}
            onChange={handleChange("username")}
            error={fieldErrors.username}
            disabled={saving}
          />
          <Input
            label="Correo electrónico"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={formData.email}
            onChange={handleChange("email")}
            error={fieldErrors.email}
            disabled={saving}
          />
          <Input
            label="Teléfono"
            type="tel"
            name="phone"
            autoComplete="tel"
            placeholder="+1234567890"
            value={formData.phone}
            onChange={handleChange("phone")}
            error={fieldErrors.phone}
            disabled={saving}
          />

          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
            >
              {serverError}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={saving} disabled={saving}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </FormModal>

      {/* Logout confirmation */}
      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="¿Cerrar sesión?"
        description="Deberás ingresar tus credenciales la próxima vez que quieras entrar."
        confirmLabel="Sí, salir"
        cancelLabel="Cancelar"
        isLoading={loggingOut}
      />
    </DashboardShell>
  );
}