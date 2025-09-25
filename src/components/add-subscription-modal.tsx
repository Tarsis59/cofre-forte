// Arquivo: src/components/add-subscription-modal.tsx (VERSÃO FINAL E FUNCIONAL)

"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";
import { Subscription } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { auth, db } from "@/lib/firebase";
import { Timestamp, addDoc, collection, doc, updateDoc } from "firebase/firestore";

import toast from "react-hot-toast";

/**
 * Schema de validação:
 * - z.preprocess trata inputs vazios e converte para Number antes de validar.
 * - billingDate exige um Date.
 */
const subscriptionSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  value: z.coerce.number().positive({ message: "O valor deve ser positivo." }),
  sharedWithCount: z.coerce.number().min(1, { message: "Deve ser pelo menos 1." }).optional(),
  // A sintaxe inválida { required_error: ... } foi removida abaixo
  category: z.enum(['Streaming', 'Trabalho', 'Bem-estar', 'Jogos', 'Outro']),
  cycle: z.enum(['monthly', 'annually']),
  billingDate: z.date(),
  description: z.string().optional(),
  isGhost: z.boolean().default(false),
});

interface AddSubscriptionModalProps {
  trigger: ReactNode;
  subscriptionToEdit?: Subscription;
}

export function AddSubscriptionModal({ trigger, subscriptionToEdit }: AddSubscriptionModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = !!subscriptionToEdit;

  // Helper seguro para transformar valores de billingDate (Timestamp | Date | number | string) em Date
  const billingDateToDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val?.toDate === "function") return val.toDate();
    if (val instanceof Date) return val;
    if (typeof val === "number") return new Date(val);
    const parsed = Date.parse(val);
    return isNaN(parsed) ? new Date() : new Date(parsed);
  };

  const form = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: isEditMode
      ? {
          name: subscriptionToEdit!.name,
          value: subscriptionToEdit!.value as any, // será validado pelo Zod
          sharedWithCount: (subscriptionToEdit as any)?.sharedWithCount ?? 1,
          billingDate: billingDateToDate((subscriptionToEdit as any)?.billingDate),
          category: subscriptionToEdit!.category ?? "Streaming",
          cycle: subscriptionToEdit!.cycle ?? "monthly",
          description: (subscriptionToEdit as any)?.description ?? "",
          isGhost: subscriptionToEdit!.isGhost ?? false,
        }
      : {
          name: "",
          value: undefined,
          sharedWithCount: 1,
          billingDate: new Date(),
          category: "Streaming",
          cycle: "monthly",
          description: "",
          isGhost: false,
        },
  });

  const onSubmit = async (values: z.infer<typeof subscriptionSchema>) => {
    setIsLoading(true);

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Usuário não autenticado.");
      setIsLoading(false);
      return;
    }

    try {
      // Garantir sharedWithCount mínimo
      const sharedWithCount = values.sharedWithCount && values.sharedWithCount > 0 ? values.sharedWithCount : 1;

      const dataToSave = {
        name: values.name,
        value: values.value,
        sharedWithCount,
        billingDate: Timestamp.fromDate(values.billingDate),
        category: values.category,
        cycle: values.cycle,
        isGhost: !!values.isGhost,
        description: values.description ?? "",
      };

      if (isEditMode && subscriptionToEdit) {
        const docRef = doc(db, "users", currentUser.uid, "subscriptions", subscriptionToEdit.id);
        await updateDoc(docRef, dataToSave);
        toast.success("Assinatura atualizada com sucesso!");
      } else {
        const collectionRef = collection(db, "users", currentUser.uid, "subscriptions");
        await addDoc(collectionRef, {
          ...dataToSave,
          userId: currentUser.uid,
          isActive: true,
          createdAt: Timestamp.now(),
        });
        toast.success("Assinatura adicionada com sucesso!");
      }

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Erro ao salvar assinatura: ", error);
      toast.error("Ocorreu um erro ao salvar a assinatura.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Assinatura" : "Adicionar Nova Assinatura"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Netflix, Spotify" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor + Dividido entre (responsivo) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 39.90"
                        {...field}
                        // react-hook-form já trata value como number após preprocess; mantemos segurança UX
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                        value={field.value === undefined ? "" : String(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sharedWithCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dividido entre</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Nº de pessoas"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                        value={field.value === undefined ? "1" : String(field.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Categoria */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Streaming', 'Trabalho', 'Bem-estar', 'Jogos', 'Outro'].map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ciclo */}
            <FormField
              control={form.control}
              name="cycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciclo</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ciclo de cobrança" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="annually">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data da cobrança */}
            <FormField
              control={form.control}
              name="billingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Próxima Cobrança</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value as Date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value as Date | undefined}
                        onSelect={(date) => field.onChange(date as Date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Plano família, dividido com mais 3 pessoas."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Modo Fantasma */}
            <FormField
              control={form.control}
              name="isGhost"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-700 p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-white">Modo Fantasma</FormLabel>
                    <p className="text-xs text-slate-400">Apenas planejar, não incluir nos gastos totais.</p>
                  </div>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={(v: boolean) => field.onChange(v)} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Botão salvar */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Salvando..." : isEditMode ? "Salvar Alterações" : "Salvar Assinatura"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
