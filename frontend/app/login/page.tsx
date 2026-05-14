"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore, type User } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import type { AxiosError } from "axios";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin123");

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    try {
      const { data } = await api.post<{ access_token: string }>("/auth/login", {
        email: email.trim(),
        password,
      });
      const { data: profile } = await api.get<User>("/auth/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      setSession(data.access_token, profile);

      toast.success(`Welcome ${profile.full_name}`);
      router.replace("/dashboard");
    } catch (err) {
      const ax = err as AxiosError<{ detail?: string | unknown }>;
      const detail = ax.response?.data?.detail;
      let message = "Unable to sign in with those credentials";
      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail.map((d) => JSON.stringify(d)).join("; ");
      }
      toast.error(message);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-neutral-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_55%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.25),transparent_45%)]" />
      <form
        onSubmit={onSubmit}
        className="relative z-[1] w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/60">HireBot</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in to continue</h1>
          <p className="mt-2 text-sm text-white/70">
            Use your admin or TAG credentials. Fresh Docker installs seed a demo admin plus TAG teammates (see hints below).
          </p>
        </div>
        <label className="block space-y-2 text-sm">
          <span className="text-white/70">Work email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-sky-400/40 focus:ring-2"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span className="text-white/70">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none ring-sky-400/40 focus:ring-2"
          />
        </label>
        <Button type="submit" className="w-full rounded-2xl bg-white text-neutral-900 hover:bg-neutral-200">
          Continue
        </Button>
        <p className="text-center text-xs text-white/50">
          Seeded demos share password{" "}
          <span className="font-mono text-white/70">admin123</span> — admin{" "}
          <span className="font-mono text-white/60">admin@gmail.com</span>, TAG teammates{" "}
          <span className="font-mono text-white/60">alex.morgan.tag@example.com</span> /{" "}
          <span className="font-mono text-white/60">jordan.lee.tag@example.com</span>. Docker Compose enables{" "}
          <span className="font-mono">UNIFY_DEMO_PASSWORDS</span> so existing volumes pick up this password too.
          Admins add more TAG accounts under Settings.
        </p>
      </form>
    </div>
  );
}
