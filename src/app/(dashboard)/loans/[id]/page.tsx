import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLoan } from "@/actions/loan-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  User,
  Calendar,
  AlertTriangle,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { LoanStatus, PaymentType, PaymentMethod } from "@/lib/validators";

const statusConfig: Record<
  LoanStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Ativo", variant: "default" },
  OVERDUE: { label: "Vencido", variant: "destructive" },
  LATE: { label: "Atrasado", variant: "destructive" },
  PAID: { label: "Quitado", variant: "secondary" },
};

const paymentTypeMap: Record<PaymentType, string> = {
  INTEREST_ONLY: "Somente Juros",
  FULL_SETTLEMENT: "Quitação Total",
};

const paymentMethodMap: Record<PaymentMethod, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  TRANSFER: "Transferência",
  OTHER: "Outro",
};

export default async function LoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loan = await getLoan(id);

  if (!loan) {
    notFound();
  }

  const status = statusConfig[loan.status as LoanStatus] || statusConfig.ACTIVE;
  const settlement = loan.settlement;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Empréstimo</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            Contrato de {loan.client.name}
          </p>
        </div>
        {loan.status !== "PAID" && (
          <Button asChild>
            <Link href={`/payments/new?loanId=${loan.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Pagamento
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <Link
                href={`/clients/${loan.client.id}`}
                className="font-medium hover:underline"
              >
                {loan.client.name}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPF:</span>
              <span>{loan.client.cpf}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefone:</span>
              <span>{loan.client.phone}</span>
            </div>
          </CardContent>
        </Card>

        {/* Informações do contrato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data do empréstimo:</span>
              <span>
                {format(loan.loanDate, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vencimento:</span>
              <span
                className={
                  settlement.daysOverdue > 0 ? "text-destructive font-medium" : ""
                }
              >
                {format(loan.dueDate, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de juros:</span>
              <span>{Number(loan.interestRate)}% por ciclo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Multa diária:</span>
              <span>{formatCurrency(loan.dailyPenalty)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cálculo atual */}
      <Card className={settlement.daysOverdue > 0 ? "border-destructive" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settlement.daysOverdue > 0 && (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
            <DollarSign className="h-5 w-5" />
            Valor Atual para Quitação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor principal:</span>
                <span>{formatCurrency(settlement.principal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Juros ({settlement.daysElapsed} dias):
                </span>
                <span>{formatCurrency(settlement.interest)}</span>
              </div>
              {settlement.daysOverdue > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Multa ({settlement.daysOverdue} dias atraso):</span>
                  <span>{formatCurrency(settlement.penalty)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total já pago:</span>
                <span className="text-green-600">
                  - {formatCurrency(settlement.totalPaid)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">
                  Total para quitação
                </p>
                <p className="text-4xl font-bold">
                  {formatCurrency(settlement.totalDue)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações */}
      {loan.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{loan.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Histórico de pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loan.payments.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum pagamento registrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loan.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(payment.paymentDate, "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {paymentTypeMap[payment.type as PaymentType]}
                      </Badge>
                    </TableCell>
                    <TableCell>{paymentMethodMap[payment.method as PaymentMethod]}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
