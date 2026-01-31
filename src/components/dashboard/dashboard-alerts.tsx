"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardAlerts } from "@/actions/dashboard-actions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/calculations";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { WhatsAppService } from "@/lib/whatsapp";
import { BellRing, CalendarClock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { ScrollArea } from "@/components/ui/scroll-area";

export function DashboardAlerts() {
    const [alerts, setAlerts] = useState<any[]>([]);

    useEffect(() => {
        async function fetchAlerts() {
            const data = await getDashboardAlerts();
            setAlerts(data);
        }
        fetchAlerts();
    }, []);

    if (alerts.length === 0) return null;

    return (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <BellRing className="h-4 w-4" />
                    Atenção: {alerts.length} Contrato(s) vencendo
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <ScrollArea className="max-h-[200px] pr-4">
                    <div className="space-y-2">
                        {alerts.map((loan) => (
                            <div
                                key={loan.id}
                                className="flex items-center justify-between p-2 bg-background rounded-lg border border-yellow-200 dark:border-yellow-800"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded-full mt-0.5">
                                        <CalendarClock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{loan.client.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Vence: {format(new Date(loan.dueDate), "dd/MM (EEEE)", { locale: ptBR })}
                                        </p>
                                        <Badge variant="outline" className="mt-1 h-5 text-xs px-1.5">
                                            {formatCurrency(Number(loan.remainingPrincipal))}
                                        </Badge>
                                    </div>
                                </div>

                                <WhatsAppButton
                                    phone={loan.client.phone}
                                    message={WhatsAppService.getDueSoonMessage(
                                        loan.client.name,
                                        formatCurrency(Number(loan.remainingPrincipal)),
                                        format(new Date(loan.dueDate), "dd/MM/yyyy"),
                                        formatCurrency(Number(loan.principalAmount) * (Number(loan.interestRate) / 100))
                                    )}
                                    label="Cobrar"
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                                />
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
