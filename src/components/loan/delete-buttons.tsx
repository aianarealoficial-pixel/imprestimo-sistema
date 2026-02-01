"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteLoan } from "@/actions/loan-actions";
import { deletePayment } from "@/actions/payment-actions";

interface DeleteLoanButtonProps {
  loanId: string;
}

export function DeleteLoanButton({ loanId }: DeleteLoanButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const result = await deleteLoan(loanId);
    setLoading(false);

    if (result.success) {
      toast.success("Empréstimo excluído com sucesso");
      setOpen(false);
      router.push("/loans");
    } else {
      toast.error(result.error || "Erro ao excluir empréstimo");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir Empréstimo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Empréstimo</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir este empréstimo? Todos os pagamentos
            relacionados também serão excluídos. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeletePaymentButtonProps {
  paymentId: string;
  onDeleted?: () => void;
}

export function DeletePaymentButton({ paymentId, onDeleted }: DeletePaymentButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const router = useRouter();

  async function handleDelete() {
    if (!reason || reason.trim().length < 3) {
      toast.error("Informe o motivo da exclusão (mínimo 3 caracteres)");
      return;
    }

    setLoading(true);
    const result = await deletePayment(paymentId, reason.trim());
    setLoading(false);

    if (result.success) {
      toast.success("Pagamento excluído com sucesso");
      setOpen(false);
      setReason("");
      router.refresh();
      onDeleted?.();
    } else {
      toast.error(result.error || "Erro ao excluir pagamento");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Pagamento</DialogTitle>
          <DialogDescription>
            Informe o motivo da exclusão. O valor será revertido do empréstimo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">Motivo da exclusão</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Lançamento duplicado, erro de digitação..."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || reason.trim().length < 3}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
