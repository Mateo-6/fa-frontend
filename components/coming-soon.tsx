"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const router = useRouter();

  React.useEffect(() => {
    const token = localStorage.getItem("fa_token") || sessionStorage.getItem("fa_token");
    if (!token) {
      router.push("/");
    }
  }, [router]);

  return (
    <DashboardShell>
      <main className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="glass-panel max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent ring-1 ring-accent/20">
            <Construction className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {description || "Esta sección estará disponible pronto."}
          </p>
          <Button asChild variant="ghost" className="mt-6">
            <Link href="/summary">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al resumen</span>
            </Link>
          </Button>
        </div>
      </main>
    </DashboardShell>
  );
}
