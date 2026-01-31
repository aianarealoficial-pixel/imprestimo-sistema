"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { settingsSchema, SettingsInput } from "@/lib/validators";
import { updateSettings } from "@/actions/settings-actions";
import { toast } from "sonner";

interface SettingsFormProps {
  settings: {
    name: string;
    defaultInterestRate: number;
    defaultDailyPenalty: number;
    defaultDueDays: number;
  };
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  async function onSubmit(data: SettingsInput) {
    setIsLoading(true);

    const result = await updateSettings(data);

    if (result.success) {
      toast.success("Configurações atualizadas!");
      router.refresh();
    } else {
      toast.error(result.error || "Erro ao atualizar configurações");
    }

    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seu Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="defaultInterestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taxa de Juros Padrão (%)</FormLabel>
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
                <FormDescription>Por ciclo de vencimento</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="defaultDailyPenalty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Multa Diária Padrão (R$)</FormLabel>
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

          <FormField
            control={form.control}
            name="defaultDueDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo Padrão (dias)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    {...field}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>Dias até vencimento</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </form>
    </Form>
  );
}
