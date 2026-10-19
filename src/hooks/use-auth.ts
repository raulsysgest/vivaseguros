"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import type { LoginCredentials } from "@/types/auth";
import type { User } from "@/types/auth";

function mapSessionUser(sessionUser: {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  agentProducer?: string;
  isCoordinator?: boolean;
  status?: string;
}): User | null {
  if (!sessionUser?.id) return null;
  return {
    id: sessionUser.id,
    name: sessionUser.name ?? "Agente",
    email: sessionUser.email ?? "",
    role: sessionUser.isCoordinator ? "coordinator" : "agent",
    agentProducer: sessionUser.agentProducer,
    isCoordinator: sessionUser.isCoordinator,
    status: sessionUser.status,
  };
}

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user ? mapSessionUser(session.user) : null;

  const login = async (credentials: LoginCredentials) => {
    const result = await signIn("credentials", {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    });

    if (result?.error) {
      const message =
        result.code && result.code !== "credentials"
          ? result.code
          : "Credenciais inválidas";
      throw new Error(message);
    }

    if (!result?.ok) {
      throw new Error("Credenciais inválidas");
    }
  };

  const logout = async () => {
    await signOut({ redirectTo: "/login" });
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading: status === "loading",
    login,
    logout,
    refreshUser: async () => {},
  };
}
