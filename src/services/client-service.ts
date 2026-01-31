import { db } from "@/lib/db";
import { ClientInput } from "@/lib/validators";

export const ClientService = {
    async createClient(userId: string, data: ClientInput) {
        const { name, cpf, phone, city, neighborhood, birthDate, notes } = data;

        // Verificar se CPF já existe para este usuário
        const existingClient = await db.client.findFirst({
            where: {
                userId,
                cpf,
                deletedAt: null,
            },
        });

        if (existingClient) {
            throw new Error("Já existe um cliente com este CPF");
        }

        return await db.client.create({
            data: {
                userId,
                name,
                cpf,
                phone,
                city,
                neighborhood,
                birthDate,
                notes,
                createdBy: userId,
            },
        });
    },

    async updateClient(userId: string, id: string, data: ClientInput) {
        const { name, cpf, phone, city, neighborhood, birthDate, notes } = data;

        // Verificar se cliente existe e pertence ao usuário
        const client = await db.client.findFirst({
            where: { id, userId, deletedAt: null },
        });

        if (!client) {
            throw new Error("Cliente não encontrado");
        }

        // Verificar se CPF já existe para outro cliente
        const existingClient = await db.client.findFirst({
            where: {
                userId,
                cpf,
                deletedAt: null,
                NOT: { id },
            },
        });

        if (existingClient) {
            throw new Error("Já existe outro cliente com este CPF");
        }

        return await db.client.update({
            where: { id },
            data: {
                name,
                cpf,
                phone,
                city,
                neighborhood,
                birthDate,
                notes,
                updatedBy: userId,
            },
        });
    },

    async deleteClient(userId: string, id: string) {
        // Verificar se cliente existe e pertence ao usuário
        const client = await db.client.findFirst({
            where: { id, userId, deletedAt: null },
        });

        if (!client) {
            throw new Error("Cliente não encontrado");
        }

        // Verificar se tem empréstimos ativos
        const activeLoans = await db.loan.count({
            where: {
                clientId: id,
                status: { in: ["ACTIVE", "OVERDUE", "LATE"] },
                deletedAt: null,
            },
        });

        if (activeLoans > 0) {
            throw new Error("Não é possível excluir cliente com empréstimos ativos");
        }

        // Soft delete
        return await db.client.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    },

    async getClients(userId: string, search?: string) {
        return await db.client.findMany({
            where: {
                userId,
                deletedAt: null,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { cpf: { contains: search } },
                        { phone: { contains: search } },
                    ],
                }),
            },
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: {
                        loans: {
                            where: { deletedAt: null },
                        },
                    },
                },
            },
        });
    },

    async getClientById(userId: string, id: string) {
        return await db.client.findFirst({
            where: {
                id,
                userId,
                deletedAt: null,
            },
            include: {
                loans: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "desc" },
                    include: {
                        payments: {
                            where: { deletedAt: null },
                            orderBy: { paymentDate: "desc" },
                        },
                    },
                },
            },
        });
    },
};
