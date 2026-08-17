import { RegisterForm } from "@/components/register-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wallet } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      {/* Atmospheric ground */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.08),_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.06),_transparent_45%)]" />

      <div className="absolute right-4 top-4">
        <ThemeToggle className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-glass-hover hover:text-ink" />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Wordmark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-accent-glow ring-1 ring-accent/20">
            <Wallet className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Financial App
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Tu dinero, bajo control.
          </p>
        </div>

        {/* Glass card */}
        <section
          className="glass-panel rounded-2xl p-6 sm:p-7"
        >
          <header className="mb-6">
            <h2 className="text-lg font-semibold text-ink">Crea tu cuenta</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Comienza a controlar tus gastos en un solo lugar.
            </p>
          </header>

          <RegisterForm />
        </section>

        <p className="mt-6 text-center text-sm text-ink-muted">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/"
            className="font-medium text-accent hover:brightness-110 transition-colors"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
