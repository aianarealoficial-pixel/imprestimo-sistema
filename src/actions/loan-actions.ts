"use server";

import { auth } from "@/lib/auth";
import { loanSchema, LoanInput, LoanStatus } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { LoanService } from "@/services/loan-service";
import { UserService } from "@/services/user-service";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function createLoan(data: LoanInput): Promise<ActionResult<any>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const validatedFields = loanSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.issues?.[0]?.message || "Erro de validação" };
  }

  try {
    const loan = await LoanService.createLoan(session.user.id, validatedFields.data);

    revalidatePath("/loans");
    revalidatePath("/dashboard");
    revalidatePath(`/clients/${validatedFields.data.clientId}`);
    return { success: true, data: loan };
  } catch (error) {
    console.error("Erro ao criar empréstimo:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao criar empréstimo" };
  }
}

export async function getLoans(filters?: {
  status?: LoanStatus;
  clientId?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await LoanService.getLoans(session.user.id, filters);
}

export async function getLoan(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  return await LoanService.getLoanById(session.user.id, id);
}

export async function updateLoanStatus(
  id: string,
  status: LoanStatus
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  try {
    await LoanService.updateLoanStatus(session.user.id, id, status);

    revalidatePath("/loans");
    revalidatePath(`/loans/${id}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao atualizar status" };
  }
}

export async function getClientsForSelect() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await LoanService.getClientsForSelect(session.user.id);
}

export async function getUserDefaults() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await UserService.getUserProfile(session.user.id);
  if (!user) return null;

  return {
    defaultInterestRate: user.defaultInterestRate,
    defaultDailyPenalty: user.defaultDailyPenalty,
    defaultDueDays: user.defaultDueDays
  };
}
