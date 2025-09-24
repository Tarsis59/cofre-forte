"use client";

import { auth, db } from "@/lib/firebase";
import { Subscription } from "@/types";
import { doc, updateDoc } from "firebase/firestore";
import { CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

interface GhostSubscriptionListProps {
  subscriptions: Subscription[];
}

export function GhostSubscriptionList({
  subscriptions,
}: GhostSubscriptionListProps) {
  const handleActivate = async (subId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const docRef = doc(db, "users", currentUser.uid, "subscriptions", subId);
    await updateDoc(docRef, { isGhost: false });
  };

  if (subscriptions.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-4">
        Você não tem nenhuma assinatura planejada.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {subscriptions.map((sub) => (
        <div key={sub.id} className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-semibold text-white">{sub.name}</p>
            <p className="text-sm text-slate-400">
              {sub.value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <Button size="sm" onClick={() => handleActivate(sub.id)}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Ativar
          </Button>
        </div>
      ))}
    </div>
  );
}
