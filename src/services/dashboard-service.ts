import { db } from "@/lib/db";
import { addDays, startOfDay, endOfDay } from "date-fns";

export const DashboardService = {
    async getDueSoonLoans(userId: string, daysThreshold: number = 3) {
        const today = startOfDay(new Date());
        const thresholdDate = endOfDay(addDays(today, daysThreshold));

        return await db.loan.findMany({
            where: {
                userId,
                status: "ACTIVE", // Apenas ativos
                deletedAt: null,
                dueDate: {
                    gte: today,
                    lte: thresholdDate,
                },
            },
            include: {
                client: {
                    select: { name: true, phone: true },
                },
            },
            orderBy: { dueDate: "asc" },
        });
    },
};
