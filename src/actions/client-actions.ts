"use server";

import { auth } from "@/lib/auth";
import { clientSchema, ClientInput } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { ClientService } from "@/services/client-service";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function createClient(data: ClientInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const validatedFields = clientSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.issues?.[0]?.message || "Erro de validação" };
  }

  try {
    await ClientService.createClient(session.user.id, validatedFields.data);
    revalidatePath("/clients");
    return { success: true };
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao criar cliente" };
  }
}

export async function updateClient(
  id: string,
  data: ClientInput
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const validatedFields = clientSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.issues?.[0]?.message || "Erro de validação" };
  }

  try {
    await ClientService.updateClient(session.user.id, id, validatedFields.data);

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar cliente" };
  }
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    await ClientService.deleteClient(session.user.id, id);

    revalidatePath("/clients");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao excluir cliente" };
  }
}

export async function getClients(search?: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await ClientService.getClients(session.user.id, search);
}

export async function getClient(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return await ClientService.getClientById(session.user.id, id);
}
