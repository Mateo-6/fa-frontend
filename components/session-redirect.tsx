"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function SessionRedirect() {
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("fa_token") || sessionStorage.getItem("fa_token");
    if (token) {
      router.replace("/summary");
    }
  }, [router]);

  return null;
}