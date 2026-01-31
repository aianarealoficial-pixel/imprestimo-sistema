import { db } from "@/lib/db";
import { Decimal } from "decimal.js";

export const ReportService = {
    async getDashboardMetrics(userId: string, startDate: Date, endDate: Date) {
        const [
            totalLent,
            totalReceived,
            activePortfolio,
            delinquency,
            loansByPeriod,
            paymentsByPeriod,
        ] = await Promise.all([
            // Total emprestado no período
            db.loan.aggregate({
                where: {
                    userId,
                    loanDate: { gte: startDate, lte: endDate },
                    deletedAt: null,
                },
                _sum: { principalAmount: true },
                _count: true,
            }),
            // Total recebido no período
            db.payment.aggregate({
                where: {
                    userId,
                    paymentDate: { gte: startDate, lte: endDate },
                    deletedAt: null,
                },
                _sum: { amount: true },
                _count: true,
            }),
            // Carteira ativa (total a receber)
            db.loan.aggregate({
                where: {
                    userId,
                    status: { in: ["ACTIVE", "OVERDUE", "LATE"] },
                    deletedAt: null,
                },
                _sum: { remainingPrincipal: true },
                _count: true,
            }),
            // Inadimplência
            db.loan.aggregate({
                where: {
                    userId,
                    status: { in: ["OVERDUE", "LATE"] },
                    deletedAt: null,
                },
                _sum: { remainingPrincipal: true },
                _count: true,
            }),
            // Empréstimos por mês no período
            db.loan.groupBy({
                by: ["loanDate"],
                where: {
                    userId,
                    loanDate: { gte: startDate, lte: endDate },
                    deletedAt: null,
                },
                _sum: { principalAmount: true },
                _count: true,
            }),
            // Pagamentos por tipo no período
            db.payment.groupBy({
                by: ["type"],
                where: {
                    userId,
                    paymentDate: { gte: startDate, lte: endDate },
                    deletedAt: null,
                },
                _sum: { amount: true },
                _count: true,
            }),
        ]);

        // Calcular juros recebidos (pagamentos de somente juros)
        const interestPayments = paymentsByPeriod.find((p: any) => p.type === "INTEREST_ONLY");
        const interestReceived = interestPayments?._sum.amount || new Decimal(0);

        return {
            totalLent: {
                amount: totalLent._sum.principalAmount || new Decimal(0),
                count: totalLent._count,
            },
            totalReceived: {
                amount: totalReceived._sum.amount || new Decimal(0),
                count: totalReceived._count,
            },
            interestReceived: {
                amount: interestReceived,
                count: interestPayments?._count || 0,
            },
            activePortfolio: {
                amount: activePortfolio._sum.remainingPrincipal || new Decimal(0),
                count: activePortfolio._count,
            },
            delinquency: {
                amount: delinquency._sum.remainingPrincipal || new Decimal(0),
                count: delinquency._count,
            },
        };
    },
};
