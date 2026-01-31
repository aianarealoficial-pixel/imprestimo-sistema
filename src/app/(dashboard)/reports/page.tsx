import { auth } from "@/lib/auth";
import { getReportData } from "@/actions/report-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Período padrão: mês atual
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  // Período anterior para comparação
  const prevStartDate = startOfMonth(subMonths(now, 1));
  const prevEndDate = endOfMonth(subMonths(now, 1));

  const [currentData, prevData] = await Promise.all([
    getReportData(startDate, endDate),
    getReportData(prevStartDate, prevEndDate),
  ]);

  if (!currentData || !prevData) return null;

  const periodLabel = format(now, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">
          Resumo financeiro - {periodLabel}
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Emprestado
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentData.totalLent.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentData.totalLent.count} contratos no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(currentData.totalReceived.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentData.totalReceived.count} pagamentos no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Juros Recebidos</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(currentData.interestReceived.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentData.interestReceived.count} pagamentos de juros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carteira Ativa</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentData.activePortfolio.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentData.activePortfolio.count} contratos ativos
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(currentData.delinquency.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentData.delinquency.count} contratos em atraso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Inadimplência
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentData.activePortfolio.count > 0
                ? (
                    (currentData.delinquency.count /
                      currentData.activePortfolio.count) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              dos contratos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo com mês anterior */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo com mês anterior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Empréstimos</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold">
                  {currentData.totalLent.count}
                </span>
                <span className="text-sm text-muted-foreground">
                  vs {prevData.totalLent.count} anterior
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Valor Emprestado</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold">
                  {formatCurrency(currentData.totalLent.amount)}
                </span>
                <span className="text-sm text-muted-foreground">
                  vs {formatCurrency(prevData.totalLent.amount)}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Valor Recebido</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold">
                  {formatCurrency(currentData.totalReceived.amount)}
                </span>
                <span className="text-sm text-muted-foreground">
                  vs {formatCurrency(prevData.totalReceived.amount)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
