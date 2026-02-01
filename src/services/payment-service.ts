import { db } from "@/lib/db";
import { PaymentInput } from "@/lib/validators";
import { Decimal } from "decimal.js";
import { calculateDueDate } from "@/lib/calculations";

export const PaymentService = {
    async registerPayment(userId: string, data: PaymentInput) {
        const { loanId, amount, paymentDate, type, method, notes } = data;

        // Verificar se empréstimo existe e pertence ao usuário
        const loan = await db.loan.findFirst({
            where: { id: loanId, userId, deletedAt: null },
        });

        if (!loan) {
            throw new Error("Empréstimo não encontrado");
        }

        if (loan.status === "PAID") {
            throw new Error("Este empréstimo já foi quitado");
        }

        // Criar pagamento
        await db.payment.create({
            data: {
                userId,
                loanId,
                amount: new Decimal(amount).toDecimalPlaces(2),
                paymentDate,
                type,
                method,
                notes,
                createdBy: userId,
            },
        });

        // Atualizar empréstimo
        const newTotalPaid = new Decimal(loan.totalPaid).add(amount);

        if (type === "FULL_SETTLEMENT") {
            // Quitação total - encerra o contrato
            await db.loan.update({
                where: { id: loanId },
                data: {
                    totalPaid: newTotalPaid,
                    remainingPrincipal: new Decimal(0),
                    status: "PAID",
                    paidAt: new Date(),
                    updatedBy: userId,
                },
            });
        } else {
            // Somente juros - renova o ciclo por mais 30 dias
            // Buscar dias padrão do usuário
            const user = await db.user.findUnique({
                where: { id: userId },
                select: { defaultDueDays: true },
            });
            const dueDays = user?.defaultDueDays ?? 30;

            // Nova data de vencimento = data do pagamento + dias padrão
            const newDueDate = calculateDueDate(paymentDate, dueDays);

            await db.loan.update({
                where: { id: loanId },
                data: {
                    totalPaid: newTotalPaid,
                    loanDate: paymentDate, // Novo ciclo começa na data do pagamento
                    dueDate: newDueDate,   // Novo vencimento
                    status: "ACTIVE",      // Garante que volta para ativo
                    updatedBy: userId,
                },
            });
        }

        return true;
    },

    async getPayments(userId: string, filters?: { loanId?: string; startDate?: Date; endDate?: Date }) {
        return await db.payment.findMany({
            where: {
                userId,
                deletedAt: null,
                ...(filters?.loanId && { loanId: filters.loanId }),
                ...(filters?.startDate &&
                    filters?.endDate && {
                    paymentDate: {
                        gte: filters.startDate,
                        lte: filters.endDate,
                    },
                }),
            },
            orderBy: { paymentDate: "desc" },
            include: {
                loan: {
                    include: {
                        client: {
                            select: { id: true, name: true, cpf: true },
                        },
                    },
                },
            },
        });
    },

    async deletePayment(userId: string, paymentId: string, reason: string) {
        // Buscar pagamento com dados do empréstimo
        const payment = await db.payment.findFirst({
            where: { id: paymentId, userId, deletedAt: null },
            include: { loan: true },
        });

        if (!payment) {
            throw new Error("Pagamento não encontrado");
        }

        // Buscar dias padrão do usuário
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { defaultDueDays: true },
        });
        const dueDays = user?.defaultDueDays ?? 30;

        // Reverter totalPaid do empréstimo
        const newTotalPaid = new Decimal(payment.loan.totalPaid).sub(payment.amount);

        // Soft delete do pagamento
        await db.payment.update({
            where: { id: paymentId },
            data: {
                deletedAt: new Date(),
                deletedBy: userId,
                deleteReason: reason,
            },
        });

        if (payment.type === "FULL_SETTLEMENT") {
            // Reverter quitação: voltar status para ACTIVE
            await db.loan.update({
                where: { id: payment.loanId },
                data: {
                    totalPaid: newTotalPaid,
                    remainingPrincipal: payment.loan.principalAmount,
                    status: "ACTIVE",
                    paidAt: null,
                    updatedBy: userId,
                },
            });
        } else {
            // INTEREST_ONLY: reverter vencimento para antes do pagamento
            // Calcula data anterior: loanDate atual - dueDays = loanDate anterior
            const previousLoanDate = new Date(payment.loan.loanDate);
            previousLoanDate.setDate(previousLoanDate.getDate() - dueDays);

            const previousDueDate = new Date(payment.loan.dueDate);
            previousDueDate.setDate(previousDueDate.getDate() - dueDays);

            await db.loan.update({
                where: { id: payment.loanId },
                data: {
                    totalPaid: newTotalPaid,
                    loanDate: previousLoanDate,
                    dueDate: previousDueDate,
                    updatedBy: userId,
                },
            });
        }

        return true;
    },
};
