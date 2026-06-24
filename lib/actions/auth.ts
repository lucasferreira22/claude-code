"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function authenticate(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      redirectTo: "/clientes",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "E-mail ou senha inválidos.";
    }
    // re-lança o redirect interno do NextAuth em caso de sucesso
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
