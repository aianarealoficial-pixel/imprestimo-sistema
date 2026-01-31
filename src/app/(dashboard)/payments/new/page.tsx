import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentForm } from "@/components/forms/payment-form";
import { getLoansForPayment } from "@/actions/payment-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewPaymentPage() {
  const loans = await getLoansForPayment();

  if (loans.length === 0) {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Não há empréstimos ativos para registrar pagamentos.
            </p>
            <Button asChild>
              <Link href="/loans/new">Criar Novo Empréstimo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForm loans={loans} />
        </CardContent>
      </Card>
    </div>
  );
}
