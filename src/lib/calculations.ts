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
 * Juros fixos por ciclo (30% = 30% independente dos dias)
 */
export function calculateInterest(
  principal: Decimal | number,
  rate: Decimal | number
): Decimal {
  const principalDecimal = new Decimal(principal);
  const rateDecimal = new Decimal(rate);

  // Juros fixos por ciclo: Principal * (Taxa / 100)
  // Ex: R$ 1.000 a 30% = R$ 300 de juros por ciclo
  return principalDecimal.mul(rateDecimal.div(100));
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
 * Juros são fixos por ciclo (30% = R$ 300 para R$ 1.000)
 * Multa é diária após vencimento
 */
export function calculateSettlement(
  principalAmount: Decimal | number,
  interestRate: Decimal | number,
  dailyPenalty: Decimal | number,
  loanDate: Date,
  dueDate: Date,
  today: Date = new Date()
): SettlementDetails {
  const principal = new Decimal(principalAmount);
  const rate = new Decimal(interestRate);
  const penalty = new Decimal(dailyPenalty);

  // Dias desde o empréstimo
  const daysElapsed = Math.max(0, differenceInDays(today, loanDate));

  // Dias em atraso (após vencimento)
  const daysOverdue = Math.max(0, differenceInDays(today, dueDate));

  // Juros fixos por ciclo (ex: 30% de R$ 1.000 = R$ 300)
  const interest = calculateInterest(principal, rate);

  // Multa diária após vencimento
  const penaltyAmount = calculatePenalty(penalty, daysOverdue);

  // Total para quitação = Principal + Juros + Multa
  const totalDue = principal.add(interest).add(penaltyAmount);

  return {
    principal,
    interest,
    penalty: penaltyAmount,
    totalPaid: new Decimal(0),
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
