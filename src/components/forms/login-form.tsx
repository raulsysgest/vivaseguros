"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginFormInputs {
  email: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const { login } = useAuth();
  const toast = useToast();
  const [authError, setAuthError] = useState<string | null>(null);

  const emailFromQuery = searchParams.get("email")?.trim() ?? "";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    defaultValues: {
      email: emailFromQuery,
      password: "",
    },
  });

  useEffect(() => {
    if (emailFromQuery) {
      reset({ email: emailFromQuery, password: "" });
    }
  }, [emailFromQuery, reset]);

  const onSubmit = async (data: LoginFormInputs) => {
    setAuthError(null);
    try {
      await login(data);
      router.replace(redirectPath);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Credenciais inválidas";
      setAuthError(message);
      toast.error(message, { description: "Verifique os dados e tente novamente." });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
      {authError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{authError}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Email ou Username <span className="text-red-500">*</span>
        </label>
        <Input
          type="text"
          placeholder="exemplo@vivaseguros.ao"
          autoComplete="username"
          {...register("email", {
            required: "O campo Email ou Username é obrigatório",
          })}
          error={errors.email?.message}
          className="rounded-lg border-zinc-300 bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Senha <span className="text-red-500">*</span>
        </label>
        <Input
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("password", {
            required: "A senha é obrigatória",
            minLength: {
              value: 6,
              message: "A senha deve ter pelo menos 6 caracteres",
            },
          })}
          error={errors.password?.message}
          className="rounded-lg border-zinc-300 bg-white"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={isSubmitting}
        className="w-full py-2.5 rounded-lg text-sm font-semibold tracking-wide mt-2"
      >
        Entrar
      </Button>
    </form>
  );
}
