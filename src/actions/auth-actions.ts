"use server";

import { signIn, signOut } from "@/lib/auth";
import { registerSchema, loginSchema, changePasswordSchema } from "@/lib/validators";
import { auth } from "@/lib/auth";
import { AuthError } from "next-auth";
import { UserService } from "@/services/user-service";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function registerUser(formData: FormData): Promise<ActionResult> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validatedFields = registerSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues?.[0]?.message || "Erro de validação",
    };
  }

  try {
    await UserService.createUser(validatedFields.data);
    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao criar conta. Tente novamente.",
    };
  }
}

export async function loginUser(formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validatedFields = loginSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues?.[0]?.message || "Erro de validação",
    };
  }

  try {
    await signIn("credentials", {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Email ou senha incorretos",
          };
        default:
          return {
            success: false,
            error: "Erro ao fazer login. Tente novamente.",
          };
      }
    }
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut({ redirect: false });
}

export async function changePassword(formData: FormData): Promise<ActionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "Você precisa estar logado",
    };
  }

  const rawData = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validatedFields = changePasswordSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.issues?.[0]?.message || "Erro de validação",
    };
  }

  try {
    await UserService.changePassword(session.user.id, validatedFields.data);
    return { success: true };
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao alterar senha. Tente novamente.",
    };
  }
}

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return await UserService.getUserProfile(session.user.id);
}
