"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AddSubscriptionModal } from "./add-subscription-modal";

import { auth, db } from "@/lib/firebase";
import { getLogoForSubscription } from "@/lib/logo-mapper";
import { cn } from "@/lib/utils";
import { Subscription } from "@/types";
import { deleteDoc, doc } from "firebase/firestore";

import { CATEGORY_COLORS } from "@/lib/colors";
import { Copy, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface SubscriptionListProps {
  subscriptions: Subscription[];

  isSimulationMode?: boolean;
  deactivatedIds?: Set<string>;
  onToggleDeactivated?: (subId: string) => void;

  filterCategory?: string | null;
  setFilterCategory?: (category: string | null) => void;
}

export function SubscriptionList({
  subscriptions,
  isSimulationMode = false,
  deactivatedIds = new Set(),
  onToggleDeactivated = () => {},
  filterCategory: externalFilterCategory,
  setFilterCategory: externalSetFilterCategory,
}: SubscriptionListProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const [internalFilterCategory, setInternalFilterCategory] = useState<
    string | null
  >(null);

  const filterCategory =
    externalFilterCategory !== undefined
      ? externalFilterCategory
      : internalFilterCategory;
  const setFilterCategory =
    externalSetFilterCategory ?? setInternalFilterCategory;

  const categories = useMemo(() => {
    const set = new Set<string>();
    subscriptions.forEach((s) => {
      set.add(s.category ?? "Outro");
    });
    return Array.from(set);
  }, [subscriptions]);

  const handleDelete = async (subscriptionId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Usuário não autenticado.");
      return;
    }

    setIsDeleting(true);
    try {
      const docRef = doc(
        db,
        "users",
        currentUser.uid,
        "subscriptions",
        subscriptionId
      );
      await deleteDoc(docRef);
      toast.success("Assinatura deletada.");
    } catch (error) {
      console.error("Erro ao deletar assinatura: ", error);
      toast.error("Ocorreu um erro ao deletar.");
    } finally {
      setIsDeleting(false);
    }
  };

  const visibleSubscriptions = useMemo(() => {
    if (!filterCategory) return subscriptions;
    return subscriptions.filter(
      (s) => (s.category ?? "Outro") === filterCategory
    );
  }, [subscriptions, filterCategory]);

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center h-full min-h-[200px] p-4 rounded-lg bg-slate-900/50 border-2 border-dashed border-slate-700">
        <h3 className="font-semibold text-white">
          Nenhuma assinatura encontrada
        </h3>
        <p className="text-sm text-slate-400">
          Clique em "Nova Assinatura" para começar a organizar suas finanças.
        </p>
      </div>
    );
  }

  const calculateUserShare = (sub: Subscription) => {
    const valueNumber =
      typeof sub.value === "number" ? sub.value : Number(sub.value ?? 0);
    const sharedCount =
      sub.sharedWithCount && sub.sharedWithCount > 0 ? sub.sharedWithCount : 1;
    return valueNumber / sharedCount;
  };

  const handleCopyShareMessage = (sub: Subscription) => {
    const valueNumber =
      typeof sub.value === "number" ? sub.value : Number(sub.value ?? 0);
    const sharedCount =
      sub.sharedWithCount && sub.sharedWithCount > 1 ? sub.sharedWithCount : 1;
    if (sharedCount <= 1) {
      toast("Assinatura não está marcada como compartilhada.", { icon: "ℹ️" });
      return;
    }

    const totalValue = valueNumber.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const userShare = (valueNumber / sharedCount).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const message = `Lembrete - Cofre Forte:\nAssinatura: ${sub.name}\nValor Total: ${totalValue}\nNossa parte (${sharedCount} pessoas): ${userShare} cada.\n\nMeu Pix é: [SUA CHAVE PIX AQUI]`;

    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard
        .writeText(message)
        .then(() => toast.success("Mensagem de cobrança copiada!"))
        .catch((err) => {
          console.error("Erro ao copiar para a área de transferência:", err);
          toast.error("Não foi possível copiar a mensagem.");
        });
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const el = document.createElement("textarea");
        el.value = message;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        toast.success("Mensagem de cobrança copiada!");
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível copiar a mensagem.");
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={filterCategory === null ? "default" : "outline"}
          onClick={() => setFilterCategory(null)}
        >
          Todos
        </Button>

        {categories.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={filterCategory === cat ? "default" : "outline"}
            onClick={() => setFilterCategory(cat)}
            style={
              filterCategory === cat
                ? {
                    backgroundColor: CATEGORY_COLORS[cat] ?? undefined,
                    color: "#fff",
                  }
                : {}
            }
          >
            {cat}
          </Button>
        ))}
      </div>

      {}
      <div className="w-full overflow-x-auto rounded-lg border border-slate-700/50">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              {isSimulationMode && <TableHead className="w-[40px]" />}
              <TableHead className="text-white whitespace-nowrap">
                Assinatura
              </TableHead>
              <TableHead className="text-white whitespace-nowrap">
                Valor
              </TableHead>
              <TableHead className="text-white whitespace-nowrap">
                Próxima Cobrança
              </TableHead>
              {!isSimulationMode && (
                <TableHead className="text-right text-white whitespace-nowrap">
                  Ações
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibleSubscriptions.map((sub) => {
              const logoUrl = getLogoForSubscription(sub.name);
              const isDeactivated = deactivatedIds.has(sub.id);

              const billingDateObj: Date =
                sub.billingDate &&
                typeof (sub.billingDate as any).toDate === "function"
                  ? (sub.billingDate as any).toDate()
                  : (sub.billingDate as Date) ?? new Date();

              const valueNumber =
                typeof sub.value === "number"
                  ? sub.value
                  : Number(sub.value ?? 0);
              const isShared = !!sub.sharedWithCount && sub.sharedWithCount > 1;
              const userShareNumber = calculateUserShare(sub);

              return (
                <TableRow
                  key={sub.id}
                  className={cn(
                    "hover:bg-slate-800/50 transition-colors",
                    isSimulationMode &&
                      isDeactivated &&
                      "opacity-40 line-through"
                  )}
                >
                  {}
                  {isSimulationMode && (
                    <TableCell>
                      <Checkbox
                        checked={!isDeactivated}
                        onCheckedChange={() => onToggleDeactivated(sub.id)}
                      />
                    </TableCell>
                  )}

                  {}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={`${sub.name} logo`}
                          width={24}
                          height={24}
                          className="rounded-md"
                        />
                      ) : (
                        <div className="h-6 w-6 rounded-md bg-slate-700 flex items-center justify-center text-xs font-bold">
                          {sub.name ? sub.name.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate max-w-[180px]">
                          {sub.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {sub.category}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {}
                  <TableCell className="whitespace-nowrap">
                    <div>
                      <span className="font-semibold text-white">
                        {valueNumber.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>/{sub.cycle === "monthly" ? "mês" : "ano"}</span>
                      {isShared && (
                        <span className="text-xs text-cyan-400">
                          • Sua parte:{" "}
                          {userShareNumber.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {}
                  <TableCell className="whitespace-nowrap">
                    {billingDateObj.toLocaleDateString("pt-BR")}
                  </TableCell>

                  {}
                  {!isSimulationMode && (
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {}
                        {isShared && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mr-2 hover:bg-cyan-900/50"
                            onClick={() => handleCopyShareMessage(sub)}
                          >
                            <Copy className="h-4 w-4 text-cyan-400" />
                          </Button>
                        )}

                        {}
                        <AddSubscriptionModal
                          subscriptionToEdit={sub}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mr-2 hover:bg-slate-700"
                            >
                              <Edit className="h-4 w-4 text-slate-400" />
                            </Button>
                          }
                        />

                        {}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-900/50"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-900 border-slate-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Você tem certeza absoluta?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-300">
                                Essa ação não pode ser desfeita. Isso irá
                                deletar permanentemente a assinatura{" "}
                                <span className="font-bold text-white">
                                  {" "}
                                  {sub.name}
                                </span>
                                .
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(sub.id)}
                                disabled={isDeleting}
                              >
                                {isDeleting ? "Deletando..." : "Confirmar"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
