"use server";

import { auth } from "@/lib/auth";
import { DashboardService } from "@/services/dashboard-service";

export async function getDashboardAlerts() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Busca empréstimos vencendo nos próximos 3 dias
    const loans = await DashboardService.getDueSoonLoans(session.user.id, 3);

    // Converte Decimal para number, pois Next.js não serializa Decimal em Client Components
    return loans.map(loan => ({
        ...loan,
        principalAmount: Number(loan.principalAmount),
        interestRate: Number(loan.interestRate),
        dailyPenalty: Number(loan.dailyPenalty),
        remainingPrincipal: Number(loan.remainingPrincipal),
        totalPaid: Number(loan.totalPaid),
    }));
}
