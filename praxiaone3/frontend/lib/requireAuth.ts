// frontend/lib/requireAuth.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function requireAuth() {
  const router = useRouter();

  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem("access");
      if (!token) router.push("/login");
    };

    check();

    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, [router]);
}
