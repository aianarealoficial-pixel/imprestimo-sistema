import { auth } from "@/lib/auth";
import { getLoans } from "@/actions/loan-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Eye } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/calculations";
import { LoanStatus } from "@/lib/validators";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { WhatsAppService } from "@/lib/whatsapp";
import { differenceInDays } from "date-fns";

const statusConfig: Record<
  LoanStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Ativo", variant: "default" },
  OVERDUE: { label: "Vencido", variant: "destructive" },
  LATE: { label: "Atrasado", variant: "destructive" },
  PAID: { label: "Quitado", variant: "secondary" },
};

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: LoanStatus; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const params = await searchParams;
  const loans = await getLoans({
    status: params.status,
    search: params.search,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Empréstimos</h1>
          <p className="text-muted-foreground">
            Gerencie seus contratos de empréstimo
          </p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/loans/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Empréstimo
          </Link>
        </Button>
      </div>

      {/* Busca */}
      <form className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Buscar por nome ou CPF do cliente..."
            defaultValue={params.search}
            className="pl-9"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {/* Filtros por status */}
      <Tabs defaultValue={params.status || "all"}>
        <TabsList>
          <TabsTrigger value="all" asChild>
            <Link href="/loans">Todos</Link>
          </TabsTrigger>
          <TabsTrigger value="ACTIVE" asChild>
            <Link href="/loans?status=ACTIVE">Ativos</Link>
          </TabsTrigger>
          <TabsTrigger value="OVERDUE" asChild>
            <Link href="/loans?status=OVERDUE">Vencidos</Link>
          </TabsTrigger>
          <TabsTrigger value="LATE" asChild>
            <Link href="/loans?status=LATE">Atrasados</Link>
          </TabsTrigger>
          <TabsTrigger value="PAID" asChild>
            <Link href="/loans?status=PAID">Quitados</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tabela */}
      {loans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {params.search || params.status
            ? "Nenhum empréstimo encontrado com esses critérios"
            : "Nenhum empréstimo cadastrado ainda"}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor Principal</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamentos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan: any) => {
                const status = statusConfig[loan.status as LoanStatus] || statusConfig.ACTIVE;
                const isOverdue =
                  loan.status !== "PAID" && new Date(loan.dueDate) < new Date();

                return (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{loan.client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {loan.client.cpf}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(loan.principalAmount)}</TableCell>
                    <TableCell>
                      {format(loan.loanDate, "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <span className={isOverdue ? "text-destructive" : ""}>
                        {format(loan.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{loan._count.payments}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {loan.status !== "PAID" && (
                        <WhatsAppButton
                          phone={loan.client.phone}
                          message={
                            isOverdue
                              ? WhatsAppService.getOverdueMessage(
                                loan.client.name,
                                formatCurrency(Number(loan.remainingPrincipal)),
                                differenceInDays(new Date(), new Date(loan.dueDate))
                              )
                              : WhatsAppService.getDueSoonMessage(
                                loan.client.name,
                                formatCurrency(Number(loan.remainingPrincipal)),
                                format(new Date(loan.dueDate), "dd/MM/yyyy"),
                                formatCurrency(Number(loan.principalAmount) * (Number(loan.interestRate) / 100))
                              )
                          }
                          label="Cobrar"
                          size="sm"
                          variant="outline"
                          className={
                            isOverdue
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                          }
                        />
                      )}
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/loans/${loan.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
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
