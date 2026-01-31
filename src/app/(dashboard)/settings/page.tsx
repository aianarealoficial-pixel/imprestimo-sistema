import { auth } from "@/lib/auth";
import { getUserSettings, updateSettings } from "@/actions/settings-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsForm } from "@/components/forms/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const settings = await getUserSettings();
  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências e valores padrão
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Valores Padrão para Novos Empréstimos</CardTitle>
          <CardDescription>
            Esses valores serão pré-preenchidos ao criar novos empréstimos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm
            settings={{
              name: settings.name || "",
              defaultInterestRate: Number(settings.defaultInterestRate),
              defaultDailyPenalty: Number(settings.defaultDailyPenalty),
              defaultDueDays: settings.defaultDueDays,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span>{settings.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID:</span>
            <span className="text-xs text-muted-foreground">{settings.id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
