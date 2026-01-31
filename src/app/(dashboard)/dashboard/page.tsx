import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, AlertTriangle, DollarSign, Plus } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/calculations";
import { Decimal } from "decimal.js";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";

async function getDashboardData(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalClients,
    activeLoans,
    overdueLoans,
    dueTodayLoans,
    totalReceivable,
    activeLoansList,
  ] = await Promise.all([
    // Total de clientes
    db.client.count({
      where: { userId, deletedAt: null },
    }),
    // Empréstimos ativos
    db.loan.count({
      where: { userId, status: "ACTIVE", deletedAt: null },
    }),
    // Empréstimos vencidos/atrasados
    db.loan.count({
      where: {
        userId,
        status: { in: ["OVERDUE", "LATE"] },
        deletedAt: null,
      },
    }),
    // Vencendo hoje
    db.loan.findMany({
      where: {
        userId,
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: "ACTIVE",
        deletedAt: null,
      },
      include: { client: true },
      take: 5,
    }),
    // Total a receber
    db.loan.aggregate({
      where: {
        userId,
        status: { in: ["ACTIVE", "OVERDUE", "LATE"] },
        deletedAt: null,
      },
      _sum: {
        remainingPrincipal: true,
      },
    }),
    // Buscar todos os empréstimos ativos para calcular juros previstos
    db.loan.findMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "OVERDUE", "LATE"] },
        deletedAt: null,
      },
      select: {
        principalAmount: true,
        interestRate: true,
      },
    }),
  ]);

  // Calcular total de juros previstos (Principal * Taxa%)
  const totalProjectedInterest = activeLoansList.reduce((acc, loan) => {
    const principal = new Decimal(loan.principalAmount);
    const rate = new Decimal(loan.interestRate).div(100);
    return acc.add(principal.mul(rate));
  }, new Decimal(0));

  return {
    totalClients,
    activeLoans,
    overdueLoans,
    dueTodayLoans,
    totalReceivable: totalReceivable._sum.remainingPrincipal || new Decimal(0),
    totalProjectedInterest,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getDashboardData(session.user.id);


  // ... existing code


  return (
    <div className="space-y-6">
      <DashboardAlerts />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu sistema de empréstimos
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button asChild className="flex-1 md:flex-none">
            <Link href="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 md:flex-none">
            <Link href="/loans/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Empréstimo
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empréstimos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeLoans}</div>
            <p className="text-xs text-muted-foreground">
              contratos em aberto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos/Atrasados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {data.overdueLoans}
            </div>
            <p className="text-xs text-muted-foreground">
              contratos em atraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalReceivable)}
            </div>
            <p className="text-xs text-muted-foreground">
              em principal (sem juros)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão de Juros (Ciclo)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.totalProjectedInterest)}
            </div>
            <p className="text-xs text-muted-foreground">
              receita estimada por ciclo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vencendo hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Vencendo Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.dueTodayLoans.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum empréstimo vencendo hoje
            </p>
          ) : (
            <div className="space-y-3">
              {data.dueTodayLoans.map((loan: any) => (
                <div
                  key={loan.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3 sm:gap-0"
                >
                  <div>
                    <p className="font-medium">{loan.client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Principal: {formatCurrency(loan.principalAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <Badge variant="outline">Vence hoje</Badge>
                    <Button asChild size="sm">
                      <Link href={`/loans/${loan.id}`}>Ver</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links rápidos */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:bg-muted/50 transition-colors">
          <Link href="/clients">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciar Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cadastre, edite e visualize seus clientes
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors">
          <Link href="/loans">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gerenciar Empréstimos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Crie e acompanhe contratos de empréstimo
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors">
          <Link href="/reports">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Ver Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Analise sua carteira e recebimentos
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
