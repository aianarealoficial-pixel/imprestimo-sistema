import { hash, compare } from "bcryptjs";
import { db } from "@/lib/db";
import { RegisterInput, ChangePasswordInput } from "@/lib/validators";

export const UserService = {
    async createUser(data: RegisterInput) {
        const { name, email, password } = data;

        // Verificar se email já existe
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error("Este email já está em uso");
        }

        // Criar usuário
        const hashedPassword = await hash(password, 12);

        const user = await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return user;
    },

    async changePassword(userId: string, data: ChangePasswordInput) {
        const { currentPassword, newPassword } = data;

        const user = await db.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.password) {
            throw new Error("Usuário não encontrado");
        }

        const isPasswordValid = await compare(currentPassword, user.password);

        if (!isPasswordValid) {
            throw new Error("Senha atual incorreta");
        }

        const hashedPassword = await hash(newPassword, 12);

        await db.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return true;
    },

    async getUserProfile(userId: string) {
        return await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                defaultInterestRate: true,
                defaultDailyPenalty: true,
                defaultDueDays: true,
                createdAt: true,
            },
        });
    },
};
