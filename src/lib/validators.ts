import { z } from "zod";

export type LoanStatus = "ACTIVE" | "PAID" | "OVERDUE" | "LATE";
export type PaymentType = "INTEREST_ONLY" | "FULL_SETTLEMENT";
export type PaymentMethod = "PIX" | "CASH" | "TRANSFER" | "OTHER";

// ============================================
// AUTENTICAÇÃO
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

// ============================================
// CLIENTES
// ============================================

export const clientSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido (formato: 000.000.000-00)"),
  phone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone inválido (formato: (00) 00000-0000)"),
  city: z.string().min(2, "Cidade é obrigatória"),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  birthDate: z.date().optional().nullable(),
  notes: z.string().optional(),
});

// ============================================
// EMPRÉSTIMOS
// ============================================

export const loanSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  principalAmount: z
    .coerce.number()
    .positive("Valor deve ser maior que zero"),
  loanDate: z.date(),
  interestRate: z
    .coerce.number()
    .min(0, "Taxa não pode ser negativa")
    .max(100, "Taxa não pode ser maior que 100%")
    .default(30),
  dailyPenalty: z
    .coerce.number()
    .min(0, "Multa não pode ser negativa")
    .default(50),
  notes: z.string().optional(),
});

// ============================================
// PAGAMENTOS
// ============================================

export const paymentSchema = z.object({
  loanId: z.string().min(1, "Selecione um empréstimo"),
  amount: z
    .coerce.number()
    .positive("Valor deve ser maior que zero"),
  paymentDate: z.date(),
  type: z.enum(["INTEREST_ONLY", "FULL_SETTLEMENT"]),
  method: z.enum(["PIX", "CASH", "TRANSFER", "OTHER"]),
  notes: z.string().optional(),
});

export const deletePaymentSchema = z.object({
  reason: z.string().min(10, "Justificativa deve ter no mínimo 10 caracteres"),
});

// ============================================
// CONFIGURAÇÕES
// ============================================

export const settingsSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").optional(),
  defaultInterestRate: z
    .coerce.number()
    .min(0, "Taxa não pode ser negativa")
    .max(100, "Taxa não pode ser maior que 100%"),
  defaultDailyPenalty: z.coerce.number().min(0, "Multa não pode ser negativa"),
  defaultDueDays: z
    .coerce.number()
    .int("Deve ser um número inteiro")
    .min(1, "Mínimo 1 dia")
    .max(365, "Máximo 365 dias"),
});

// ============================================
// TIPOS INFERIDOS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type LoanInput = z.infer<typeof loanSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type DeletePaymentInput = z.infer<typeof deletePaymentSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
