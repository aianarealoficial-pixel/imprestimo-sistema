import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanForm } from "@/components/forms/loan-form";
import { getClientsForSelect, getUserDefaults } from "@/actions/loan-actions";

export default async function NewLoanPage() {
  const [clients, defaults] = await Promise.all([
    getClientsForSelect(),
    getUserDefaults(),
  ]);

  if (clients.length === 0) {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Novo Empréstimo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você precisa cadastrar pelo menos um cliente antes de criar um
              empréstimo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Novo Empréstimo</CardTitle>
        </CardHeader>
        <CardContent>
          <LoanForm
            clients={clients}
            defaults={
              defaults
                ? {
                    defaultInterestRate: Number(defaults.defaultInterestRate),
                    defaultDailyPenalty: Number(defaults.defaultDailyPenalty),
                    defaultDueDays: defaults.defaultDueDays,
                  }
                : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
