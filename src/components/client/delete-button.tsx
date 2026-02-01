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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteClient } from "@/actions/client-actions";

interface DeleteClientButtonProps {
  clientId: string;
  clientName: string;
}

export function DeleteClientButton({ clientId, clientName }: DeleteClientButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const result = await deleteClient(clientId);
    setLoading(false);

    if (result.success) {
      toast.success("Cliente excluído com sucesso");
      setOpen(false);
      router.push("/clients");
    } else {
      toast.error(result.error || "Erro ao excluir cliente");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Cliente</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o cliente <strong>{clientName}</strong>?
            {" "}Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 text-sm text-muted-foreground">
          <p>Clientes com empréstimos ativos não podem ser excluídos.</p>
        </div>
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
