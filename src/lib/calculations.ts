import { Decimal } from "decimal.js";
import { differenceInDays } from "date-fns";

export interface SettlementDetails {
  principal: Decimal;
  interest: Decimal;
  penalty: Decimal;
  totalPaid: Decimal;
  totalDue: Decimal;
  daysElapsed: number;
  daysOverdue: number;
}

/**
 * Calcula os juros baseado no valor principal e taxa
 * Taxa de 30% por ciclo de 30 dias
 */
export function calculateInterest(
  principal: Decimal | number,
  rate: Decimal | number,
  days: number
): Decimal {
  const principalDecimal = new Decimal(principal);
  const rateDecimal = new Decimal(rate);

  // Juros = Principal * (Taxa / 100) * (dias / 30)
  // Usando proporção linear para não zerar juros antes de 30 dias
  // const cycles = days / 30; -- Usar Divisão Decimal
  return principalDecimal
    .mul(rateDecimal.div(100))
    .mul(new Decimal(days).div(30));
}

/**
 * Calcula a multa por atraso
 * R$ 50 por dia após vencimento
 */
export function calculatePenalty(
  dailyPenalty: Decimal | number,
  daysOverdue: number
): Decimal {
  const penaltyDecimal = new Decimal(dailyPenalty);
  return penaltyDecimal.mul(Math.max(0, daysOverdue));
}

/**
 * Calcula todos os valores para quitação de um empréstimo
 */
export function calculateSettlement(
  principalAmount: Decimal | number,
  interestRate: Decimal | number,
  dailyPenalty: Decimal | number,
  payments: { totalPaid: Decimal | number; interestOnlyPaid: Decimal | number },
  loanDate: Date,
  dueDate: Date,
  today: Date = new Date(),
  lastInterestPaymentDate?: Date | null
): SettlementDetails {
  const principal = new Decimal(principalAmount);
  const rate = new Decimal(interestRate);
  const penalty = new Decimal(dailyPenalty);

  const totalPaid = new Decimal(payments.totalPaid);
  const interestOnlyPaid = new Decimal(payments.interestOnlyPaid);

  // Dias desde o último pagamento de juros (ou desde o empréstimo se nunca pagou)
  const interestStartDate = lastInterestPaymentDate || loanDate;
  const daysElapsed = Math.max(0, differenceInDays(today, interestStartDate));

  // Dias em atraso (após vencimento)
  const daysOverdue = Math.max(0, differenceInDays(today, dueDate));

  // Cálculos
  const interest = calculateInterest(principal, rate, daysElapsed);
  const penaltyAmount = calculatePenalty(penalty, daysOverdue);

  // Pagamentos de quitação (abate do principal)
  const principalPaidByRegular = totalPaid.sub(interestOnlyPaid);
  const remainingPrincipal = principal.sub(principalPaidByRegular);

  // Lógica de juros:
  // Se há último pagamento de juros, os juros são calculados desde essa data
  // e NÃO subtraímos pagamentos anteriores (já estão "quitados")
  // Se não há, subtraímos os pagamentos de juros do total acumulado
  let effectiveUnpaidInterest: Decimal;

  if (lastInterestPaymentDate) {
    // Juros calculados desde o último pagamento - não subtrair pagamentos anteriores
    effectiveUnpaidInterest = interest.add(penaltyAmount);
  } else {
    // Sem pagamento de juros anterior - subtrair do total
    const unpaidInterestAndPenalty = interest.add(penaltyAmount).sub(interestOnlyPaid);
    effectiveUnpaidInterest = Decimal.max(0, unpaidInterestAndPenalty);
  }

  const totalDue = remainingPrincipal.add(effectiveUnpaidInterest);

  return {
    principal: remainingPrincipal, // Mostra o principal restante real
    interest,
    penalty: penaltyAmount,
    totalPaid,
    totalDue: Decimal.max(totalDue, new Decimal(0)),
    daysElapsed,
    daysOverdue,
  };
}

/**
 * Formata valor em Real brasileiro
 */
export function formatCurrency(value: Decimal | number | string | undefined): string {
  if (value === undefined || value === null || value === "") return "R$ 0,00";

  let num: number;

  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string") {
    num = parseFloat(value) || 0;
  } else {
    // Assume Decimal
    num = value.toNumber();
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

/**
 * Calcula a data de vencimento (empréstimo + dias)
 */
export function calculateDueDate(loanDate: Date, days: number = 30): Date {
  const dueDate = new Date(loanDate);
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate;
}
