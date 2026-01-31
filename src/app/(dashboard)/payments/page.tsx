import { auth } from "@/lib/auth";
import { getPayments } from "@/actions/payment-actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/calculations";
import { PaymentType, PaymentMethod } from "@/lib/validators";

const paymentTypeMap: Record<PaymentType, { label: string; variant: "default" | "secondary" }> = {
  INTEREST_ONLY: { label: "Somente Juros", variant: "secondary" },
  FULL_SETTLEMENT: { label: "Quitação Total", variant: "default" },
};

const paymentMethodMap: Record<PaymentMethod, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  TRANSFER: "Transferência",
  OTHER: "Outro",
};

export default async function PaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const payments = await getPayments();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pagamentos</h1>
          <p className="text-muted-foreground">
            Histórico de pagamentos recebidos
          </p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/payments/new">
            <Plus className="mr-2 h-4 w-4" />
            Registrar Pagamento
          </Link>
        </Button>
      </div>

      {/* Tabela */}
      {payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum pagamento registrado ainda
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Observação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment: any) => {
                const typeConfig = paymentTypeMap[payment.type as PaymentType];
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(payment.paymentDate, "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.loan.client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.loan.client.cpf}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                    </TableCell>
                    <TableCell>{paymentMethodMap[payment.method as PaymentMethod]}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {payment.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/loans/${payment.loanId}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Contrato
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
