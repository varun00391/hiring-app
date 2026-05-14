"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { User } from "@/store/auth-store";
import { useAuthStore } from "@/store/auth-store";

export function TagTeamSettingsSection() {
  const role = useAuthStore((s) => s.user?.role.name);
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");

  const { data: members } = useQuery({
    queryKey: ["tag-members"],
    queryFn: async () => {
      const { data } = await api.get<User[]>("/reference/tag-members");
      return data;
    },
    enabled: role === "admin",
  });

  const createMember = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<User>("/users/tag-members", {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        specialization: specialization.trim() || null,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("TAG member account created");
      setEmail("");
      setPassword("");
      setFullName("");
      setSpecialization("");
      queryClient.invalidateQueries({ queryKey: ["tag-members"] });
    },
    onError: (err: AxiosError<{ detail?: unknown }>) => {
      const d = err.response?.data?.detail;
      let message = "Could not create TAG member";
      if (typeof d === "string") message = d;
      else if (Array.isArray(d)) message = d.map((x) => JSON.stringify(x)).join("; ");
      toast.error(message);
    },
  });

  if (role !== "admin") {
    return null;
  }

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    createMember.mutate();
  }

  return (
    <Card>
      <CardHeader className="text-sm font-semibold">TAG team accounts</CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Admins create individual TAG member logins (email + password). Share credentials securely with each teammate—there is no open signup.
        </p>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm sm:col-span-2">
            <span className="text-neutral-600 dark:text-neutral-400">Work email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none ring-sky-500/30 focus:ring-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
              placeholder="alex@company.com"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Temporary password</span>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none ring-sky-500/30 focus:ring-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
              placeholder="At least 8 characters"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Full name</span>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none ring-sky-500/30 focus:ring-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
            />
          </label>
          <label className="block space-y-1 text-sm sm:col-span-2">
            <span className="text-neutral-600 dark:text-neutral-400">Specialization (optional)</span>
            <input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-900 outline-none ring-sky-500/30 focus:ring-2 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50"
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={createMember.isPending} className="rounded-xl">
              {createMember.isPending ? "Creating…" : "Create TAG member"}
            </Button>
          </div>
        </form>
        <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Active TAG members</p>
          <ul className="space-y-2 text-sm">
            {(members ?? []).map((m) => (
              <li key={m.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-900">
                <span className="font-medium">{m.full_name}</span>
                <span className="text-neutral-500">{m.email}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
