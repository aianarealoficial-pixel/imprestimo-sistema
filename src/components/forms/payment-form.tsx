"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
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
import { paymentSchema, PaymentInput } from "@/lib/validators";
import { registerPayment } from "@/actions/payment-actions";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/calculations";
import { Decimal } from "decimal.js";

interface LoanForPayment {
  id: string;
  principalAmount: Decimal;
  dueDate: Date;
  client: { name: string; cpf: string };
}

interface PaymentFormProps {
  loans: LoanForPayment[];
}

export function PaymentForm({ loans }: PaymentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const preselectedLoanId = searchParams.get("loanId");

  const form = useForm<any>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      loanId: preselectedLoanId || "",
      amount: undefined as any,
      paymentDate: new Date(),
      type: undefined,
      method: undefined,
      notes: "",
    },
  });

  const selectedLoanId = form.watch("loanId");
  const selectedLoan = loans.find((l) => l.id === selectedLoanId);

  async function onSubmit(data: PaymentInput) {
    setIsLoading(true);

    const result = await registerPayment(data);

    if (result.success) {
      toast.success("Pagamento registrado com sucesso!");
      router.push("/payments");
      router.refresh();
    } else {
      toast.error(result.error || "Erro ao registrar pagamento");
    }

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="loanId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Empréstimo *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um empréstimo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {loans.map((loan) => (
                    <SelectItem key={loan.id} value={loan.id}>
                      {loan.client.name} - {formatCurrency(loan.principalAmount)} -
                      Vence: {format(loan.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedLoan && (
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Contrato selecionado</h4>
            <div className="grid gap-1 text-sm">
              <p>
                <span className="text-muted-foreground">Cliente:</span>{" "}
                {selectedLoan.client.name}
              </p>
              <p>
                <span className="text-muted-foreground">Valor principal:</span>{" "}
                {formatCurrency(selectedLoan.principalAmount)}
              </p>
              <p>
                <span className="text-muted-foreground">Vencimento:</span>{" "}
                {format(selectedLoan.dueDate, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor pago (R$) *</FormLabel>
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
            name="paymentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do pagamento *</FormLabel>
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de pagamento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INTEREST_ONLY">
                      Somente Juros (mantém principal)
                    </SelectItem>
                    <SelectItem value="FULL_SETTLEMENT">
                      Quitação Total (encerra contrato)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de pagamento *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="CASH">Dinheiro</SelectItem>
                    <SelectItem value="TRANSFER">Transferência</SelectItem>
                    <SelectItem value="OTHER">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o pagamento..."
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
            {isLoading ? "Registrando..." : "Registrar Pagamento"}
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
      </form>
    </Form>
  );
}
