"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { loanSchema, LoanInput } from "@/lib/validators";
import { createLoan } from "@/actions/loan-actions";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/calculations";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { WhatsAppService } from "@/lib/whatsapp";

interface LoanFormProps {
    clients: Array<{ id: string; name: string; cpf: string }>;
    defaults: {
        defaultInterestRate: number;
        defaultDailyPenalty: number;
        defaultDueDays: number;
    } | null;
}

export function LoanForm({ clients, defaults }: LoanFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [successData, setSuccessData] = useState<{
        clientName: string;
        clientPhone: string;
        loanId: string;
        principalAmount: number;
        dueDate: Date;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const preselectedClientId = searchParams.get("clientId");

    const form = useForm<any>({
        resolver: zodResolver(loanSchema),
        defaultValues: {
            clientId: preselectedClientId || "",
            principalAmount: undefined as any,
            loanDate: new Date(),
            interestRate: defaults?.defaultInterestRate
                ? Number(defaults.defaultInterestRate)
                : 30,
            dailyPenalty: defaults?.defaultDailyPenalty
                ? Number(defaults.defaultDailyPenalty)
                : 50,
            notes: "",
        },
    });

    const loanDate = form.watch("loanDate");
    const principalAmount = form.watch("principalAmount");
    const interestRate = form.watch("interestRate");
    const dueDays = defaults?.defaultDueDays || 30;

    const dueDate = loanDate ? addDays(loanDate, dueDays) : null;
    const principalAmountValue = Number(principalAmount) || 0;
    const interestRateValue = Number(interestRate) || 0;
    const estimatedInterest = principalAmountValue * (interestRateValue / 100);

    async function onSubmit(data: LoanInput) {
        setIsLoading(true);

        const result = await createLoan(data);

        if (result.success && result.data) {
            const loan = result.data;
            setSuccessData({
                clientName: loan.client.name,
                clientPhone: loan.client.phone,
                loanId: loan.id,
                principalAmount: Number(loan.principalAmount),
                dueDate: new Date(loan.dueDate),
            });
            toast.success("Empréstimo criado com sucesso!");
            form.reset();
        } else {
            toast.error(result.error || "Erro ao criar empréstimo");
        }

        setIsLoading(false);
    }

    return (
        <>
            <Dialog open={!!successData} onOpenChange={(open) => !open && setSuccessData(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Empréstimo Criado!</DialogTitle>
                        <DialogDescription>
                            O que você deseja fazer agora?
                        </DialogDescription>
                    </DialogHeader>

                    {successData && (
                        <div className="flex flex-col gap-3 mt-4">
                            <WhatsAppButton
                                phone={successData.clientPhone}
                                message={WhatsAppService.getNewLoanMessage(
                                    successData.clientName,
                                    formatCurrency(successData.principalAmount),
                                    format(successData.dueDate, "dd/MM/yyyy")
                                )}
                                label="Enviar Comprovante via WhatsApp"
                                variant="default"
                                size="lg"
                                className="w-full bg-green-600 hover:bg-green-700"
                            />

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    router.push("/loans");
                                    router.refresh();
                                }}
                            >
                                Ir para Lista de Empréstimos
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => setSuccessData(null)}
                            >
                                Criar Novo Empréstimo
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Form {...form}>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cliente *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um cliente" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.name} - {client.cpf}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="principalAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor do empréstimo (R$) *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0,00"
                                            {...field}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="loanDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Data do empréstimo *</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                                    ) : (
                                                        <span>Selecione uma data</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                locale={ptBR}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="interestRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Taxa de juros (%) *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            {...field}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormDescription>Por ciclo de {dueDays} dias</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dailyPenalty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Multa diária (R$) *</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            {...field}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormDescription>Por dia de atraso</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    {/* Cálculos automáticos */}
                    {principalAmountValue > 0 && dueDate && (
                        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                            <h4 className="font-medium">Resumo do contrato</h4>
                            <div className="grid gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Valor principal:</span>
                                    <span className="font-medium">{formatCurrency(principalAmountValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Data de vencimento:</span>
                                    <span className="font-medium">
                                        {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Juros estimado ({interestRateValue}%):
                                    </span>
                                    <span className="font-medium">{formatCurrency(estimatedInterest)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-muted-foreground">Total no vencimento:</span>
                                    <span className="font-bold">
                                        {formatCurrency(principalAmountValue + estimatedInterest)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                    }

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Observações</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Observações sobre o empréstimo..."
                                        className="resize-none"
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex gap-4">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Criando..." : "Criar Empréstimo"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form >
            </Form >
        </>
    );
}
