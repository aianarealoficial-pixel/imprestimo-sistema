import { db } from "@/lib/db";
import { SettingsInput } from "@/lib/validators";
import { Decimal } from "decimal.js";

export const SettingsService = {
    async getUserSettings(userId: string) {
        return await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                defaultInterestRate: true,
                defaultDailyPenalty: true,
                defaultDueDays: true,
            },
        });
    },

    async updateSettings(userId: string, data: SettingsInput) {
        const { name, defaultInterestRate, defaultDailyPenalty, defaultDueDays } = data;

        return await db.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                defaultInterestRate: new Decimal(defaultInterestRate),
                defaultDailyPenalty: new Decimal(defaultDailyPenalty),
                defaultDueDays,
            },
        });
    },
};
