import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getClient } from "@/actions/client-actions";
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
import { Pencil, Plus, Phone, MapPin, Calendar, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";

const statusMap = {
  ACTIVE: { label: "Ativo", variant: "default" as const },
  OVERDUE: { label: "Vencido", variant: "destructive" as const },
  LATE: { label: "Atrasado", variant: "destructive" as const },
  PAID: { label: "Quitado", variant: "secondary" as const },
};

export default async function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground">CPF: {client.cpf}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/clients/${client.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/loans/new?clientId=${client.id}`}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Empréstimo
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {client.city}, {client.neighborhood}
              </span>
            </div>
            {client.birthDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(client.birthDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
            {client.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground font-medium mb-1">
                  Observações:
                </p>
                <p className="text-sm">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de empréstimos:</span>
              <span className="font-medium">{client.loans.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ativos:</span>
              <span className="font-medium">
                {client.loans.filter((l) => l.status === "ACTIVE").length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Em atraso:</span>
              <span className="font-medium text-destructive">
                {
                  client.loans.filter(
                    (l) => l.status === "OVERDUE" || l.status === "LATE"
                  ).length
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quitados:</span>
              <span className="font-medium">
                {client.loans.filter((l) => l.status === "PAID").length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de empréstimos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Empréstimos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client.loans.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              Nenhum empréstimo registrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Principal</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamentos</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.loans.map((loan) => {
                  const status = statusMap[loan.status as keyof typeof statusMap] || statusMap.ACTIVE;
                  return (
                    <TableRow key={loan.id}>
                      <TableCell>
                        {format(loan.loanDate, "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{formatCurrency(loan.principalAmount)}</TableCell>
                      <TableCell>
                        {format(loan.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>{loan.payments.length}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/loans/${loan.id}`}>Ver detalhes</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
