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
  today: Date = new Date()
): SettlementDetails {
  const principal = new Decimal(principalAmount);
  const rate = new Decimal(interestRate);
  const penalty = new Decimal(dailyPenalty);

  const totalPaid = new Decimal(payments.totalPaid);
  const interestOnlyPaid = new Decimal(payments.interestOnlyPaid);

  // Dias desde o empréstimo
  const daysElapsed = Math.max(0, differenceInDays(today, loanDate));

  // Dias em atraso (após vencimento)
  const daysOverdue = Math.max(0, differenceInDays(today, dueDate));

  // Cálculos
  const interest = calculateInterest(principal, rate, daysElapsed);
  const penaltyAmount = calculatePenalty(penalty, daysOverdue);

  const totalAccruedInterestAndPenalty = interest.add(penaltyAmount);

  // Lógica:
  // Pagamentos "Somente Juros" abatem APENAS Juros e Multa.
  // Se pagou mais juros do que devia, fica como crédito de juros (não abate principal na visão do agiota padrão)
  // Mas para facilitar, vamos dizer que abate juros futuros, mas NUNCA principal.

  // Pagamentos "Normais" (Quitação) abatem tudo.
  // Como só temos 2 tipos, assumimos que totalPaid engloba tudo.

  // Saldo devedor = Principal + (Juros+Multa - JurosPagos) - (TotalPago - JurosPagos)
  // Simplificando: Saldo = Principal + Juros + Multa - TotalPago

  // O PROBLEMA: O usuário diz que "Saldo devedor não deve abaixar para 700".
  // Se TotalPago = 300 e Juros = 0, Saldo = 1000 + 0 - 300 = 700.

  // SOLUÇÃO: Se o pagamento for "Somente Juros", ele não deve reduzir o Principal, 
  // mesmo que exceda o juro atual.

  const principalPaidByRegular = totalPaid.sub(interestOnlyPaid); // Pagamentos de quitação

  // Juros devidos = Max(0, JurosTotais - JurosPagos)
  // Se JurosPagos > JurosTotais, temos um crédito de juros, que não afeta o principal.
  const unpaidInterestAndPenalty = totalAccruedInterestAndPenalty.sub(interestOnlyPaid);

  // Mas se for negativo (crédito), não subtraímos do principal. Trava no 0 ou mantém negativo separado?
  // O usuário quer ver "1.000,00".
  // Se unpaidInterest for -200 (crédito), e Principal 1000.
  // TotalDue = 1000 + (-200)? Não. TotalDue = 1000.

  // Ajuste: 
  // TotalDue = Principal - principalPaidByRegular + MAX(0, unpaidInterestAndPenalty)

  // Mas espere, se eu paguei juros adiantado, eu não devo nada "agora", mas devo o Principal.

  const effectiveUnpaidInterest = Decimal.max(0, unpaidInterestAndPenalty);

  const remainingPrincipal = principal.sub(principalPaidByRegular);

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
