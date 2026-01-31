"use server";

import { auth } from "@/lib/auth";
import { paymentSchema, PaymentInput } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { PaymentService } from "@/services/payment-service";
import { LoanService } from "@/services/loan-service";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

export async function registerPayment(data: PaymentInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Não autorizado" };
  }

  const validatedFields = paymentSchema.safeParse(data);
  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.issues?.[0]?.message || "Erro de validação" };
  }

  try {
    await PaymentService.registerPayment(session.user.id, validatedFields.data);

    revalidatePath("/payments");
    revalidatePath("/loans");
    revalidatePath(`/loans/${validatedFields.data.loanId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao registrar pagamento" };
  }
}

export async function getPayments(filters?: {
  loanId?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await PaymentService.getPayments(session.user.id, filters);
}

export async function getLoansForPayment() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await LoanService.getLoansPendingPayment(session.user.id);
}
