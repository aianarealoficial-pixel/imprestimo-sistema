"use server";

import { auth } from "@/lib/auth";
import { settingsSchema, SettingsInput } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { SettingsService } from "@/services/settings-service";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function getUserSettings() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return await SettingsService.getUserSettings(session.user.id);
}

export async function updateSettings(data: SettingsInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const validatedFields = settingsSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.issues?.[0]?.message || "Erro de validação" };
  }

  try {
    await SettingsService.updateSettings(session.user.id, validatedFields.data);

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar configurações" };
  }
}
