import { db } from "@/lib/db";
import { LoanInput, LoanStatus } from "@/lib/validators";
import { calculateDueDate, calculateSettlement } from "@/lib/calculations";
import { Decimal } from "decimal.js";

export const LoanService = {
    async createLoan(userId: string, data: LoanInput) {
        const { clientId, principalAmount, loanDate, interestRate, dailyPenalty, notes } = data;

        // Verificar se cliente existe e pertence ao usuário
        const client = await db.client.findFirst({
            where: { id: clientId, userId, deletedAt: null },
        });

        if (!client) {
            throw new Error("Cliente não encontrado");
        }

        // Buscar configurações padrão do usuário
        const user = await db.user.findUnique({
            where: { id: userId },
        });

        const finalInterestRate = interestRate ?? user?.defaultInterestRate ?? 30;
        const finalDailyPenalty = dailyPenalty ?? user?.defaultDailyPenalty ?? 50;
        const dueDays = user?.defaultDueDays ?? 30;

        const dueDate = calculateDueDate(loanDate, dueDays);

        return await db.loan.create({
            data: {
                userId,
                clientId,
                principalAmount: new Decimal(principalAmount).toDecimalPlaces(2),
                loanDate,
                dueDate,
                interestRate: new Decimal(finalInterestRate),
                dailyPenalty: new Decimal(finalDailyPenalty),
                remainingPrincipal: new Decimal(principalAmount).toDecimalPlaces(2),
                notes,
                createdBy: userId,
            },
            include: {
                client: true,
            },
        });
    },

    async getLoans(userId: string, filters?: { status?: LoanStatus; clientId?: string; search?: string }) {
        return await db.loan.findMany({
            where: {
                userId,
                deletedAt: null,
                ...(filters?.status && { status: filters.status }),
                ...(filters?.clientId && { clientId: filters.clientId }),
                ...(filters?.search && {
                    client: {
                        OR: [
                            { name: { contains: filters.search, mode: "insensitive" } },
                            { cpf: { contains: filters.search } },
                        ],
                    },
                }),
            },
            orderBy: { createdAt: "desc" },
            include: {
                client: {
                    select: { id: true, name: true, cpf: true, phone: true },
                },
                _count: {
                    select: { payments: { where: { deletedAt: null } } },
                },
            },
        });
    },

    async getLoanById(userId: string, id: string) {
        const loan = await db.loan.findFirst({
            where: {
                id,
                userId,
                deletedAt: null,
            },
            include: {
                client: true,
                payments: {
                    where: { deletedAt: null },
                    orderBy: { paymentDate: "desc" },
                },
            },
        });

        if (!loan) return null;

        // Calcular valores de quitação (juros fixos por ciclo + multa)
        const settlement = calculateSettlement(
            loan.remainingPrincipal,
            loan.interestRate,
            loan.dailyPenalty,
            loan.loanDate,
            loan.dueDate
        );

        // Calcular total já pago
        const totalPaid = loan.payments.reduce(
            (acc: Decimal, payment) => acc.add(new Decimal(payment.amount)),
            new Decimal(0)
        );

        return {
            ...loan,
            settlement: {
                ...settlement,
                totalPaid,
            },
        };
    },

    async updateLoanStatus(userId: string, id: string, status: LoanStatus) {
        const loan = await db.loan.findFirst({
            where: { id, userId, deletedAt: null },
        });

        if (!loan) {
            throw new Error("Empréstimo não encontrado");
        }

        return await db.loan.update({
            where: { id },
            data: {
                status,
                updatedBy: userId,
                ...(status === "PAID" && { paidAt: new Date() }),
            },
        });
    },

    async getLoansPendingPayment(userId: string) {
        return await db.loan.findMany({
            where: {
                userId,
                status: { not: "PAID" },
                deletedAt: null,
            },
            include: {
                client: {
                    select: { name: true, cpf: true },
                },
            },
            orderBy: { dueDate: "asc" },
        });
    },

    async getClientsForSelect(userId: string) {
        return await db.client.findMany({
            where: {
                userId,
                deletedAt: null,
            },
            select: {
                id: true,
                name: true,
                cpf: true,
            },
            orderBy: { name: "asc" },
        });
    },
};
