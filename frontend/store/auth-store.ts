import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "admin" | "tag_member" | string;

export type User = {
  id: string;
  email: string;
  full_name: string;
  specialization: string | null;
  role: { id: string; name: Role };
};

type AuthState = {
  token: string | null;
  user: User | null;
  setSession: (token: string, user: User) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: "hirebot-auth-v1" },
  ),
);
