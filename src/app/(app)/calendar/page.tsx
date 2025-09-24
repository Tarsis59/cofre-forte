"use client";

import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import { getColorForCategory } from "@/lib/colors";
import { calculateFutureBillingDates } from "@/lib/date-logic";
import { auth, db } from "@/lib/firebase";
import { getLogoForSubscription } from "@/lib/logo-mapper";
import { Subscription } from "@/types";

import { AnimatedGradientText } from "@/components/animated-gradient-text";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function CalendarPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [subsForSelectedDate, setSubsForSelectedDate] = useState<
    Subscription[]
  >([]);

  useEffect(() => {
    let unsubSnapshot: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setSubscriptions([]);
        setIsLoading(false);
        return;
      }

      const q = query(collection(db, "users", user.uid, "subscriptions"));
      unsubSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const subs = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Subscription)
          );
          setSubscriptions(subs);
          setIsLoading(false);
        },
        (err) => {
          console.error("Erro ao ouvir subscriptions:", err);
          setIsLoading(false);
        }
      );
    });

    return () => {
      if (unsubSnapshot) unsubSnapshot();
      unsubAuth();
    };
  }, []);

  const { modifiers, modifiersStyles } = useMemo(() => {
    const mods: { [key: string]: Date[] } = {};
    const styles: { [key: string]: React.CSSProperties } = {};

    subscriptions.forEach((sub) => {
      if (!sub.isActive) return;

      const baseKey = (sub.category || "Outro")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

      const categoryKey = sub.isGhost ? `${baseKey}-ghost` : baseKey;

      const dates = calculateFutureBillingDates([sub]);
      if (!dates || dates.length === 0) return;

      if (!mods[categoryKey]) mods[categoryKey] = [];
      mods[categoryKey].push(...dates);

      const baseColor = getColorForCategory(sub.category || "Outro");
      styles[categoryKey] = sub.isGhost
        ? {
            background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 4px, transparent 4px 8px), linear-gradient(135deg, ${baseColor} 0%, #0f172a 100%)`,
            color: "#e6fffa",
            fontWeight: "600",
            borderRadius: "10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            opacity: 0.85,
            cursor: "pointer",
            border: "1px dashed rgba(255,255,255,0.06)",
          }
        : {
            background: `linear-gradient(135deg, ${baseColor} 0%, #0f172a 100%)`,
            color: "#f8fafc",
            fontWeight: "700",
            borderRadius: "12px",
            boxShadow: "0 6px 12px rgba(0,0,0,0.35)",
            transition: "all 0.25s ease",
            cursor: "pointer",
          };
    });

    return { modifiers: mods, modifiersStyles: styles };
  }, [subscriptions]);

  const handleDayClick = (day: Date) => {
    const subsOnDate = subscriptions.filter((sub) => {
      if (!sub.isActive) return false;
      const dates = calculateFutureBillingDates([sub]);
      return dates.some((billingDate) => isSameDay(billingDate, day));
    });

    if (subsOnDate.length > 0) {
      setSelectedDate(day);
      setSubsForSelectedDate(subsOnDate);
    }
  };

  if (isLoading) {
    return (
      <p className="text-white animate-pulse text-center mt-10">
        Carregando calendário...
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-0 max-w-5xl mx-auto">
        {}
        <div className="flex flex-col items-center justify-center text-center">
          <AnimatedGradientText
            text="Calendário de Cobranças"
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter"
          />
          <p className="text-slate-400 mt-2 text-sm sm:text-base md:text-lg">
            Suas cobranças futuras, coloridas por categoria.
          </p>
        </div>

        {}
        <Card className="bg-slate-900 border-slate-700/50 p-2 sm:p-4 overflow-x-auto shadow-lg transition-all duration-300 hover:shadow-2xl">
          <Calendar
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            onDayClick={handleDayClick}
            className="w-full min-w-[280px] sm:min-w-[320px] lg:min-w-full transition-all duration-200"
          />
        </Card>
      </div>

      {}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg mx-2 sm:mx-auto rounded-xl shadow-2xl transition-transform duration-300 ease-out transform scale-95 sm:scale-100">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold">
              Cobranças para{" "}
              {selectedDate
                ? format(selectedDate, "PPP", { locale: ptBR })
                : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {subsForSelectedDate.map((sub) => {
              const logoUrl = getLogoForSubscription(sub.name);
              const isGhost = !!sub.isGhost;
              const valueNumber =
                typeof sub.value === "number"
                  ? sub.value
                  : Number(sub.value || 0);

              return (
                <div
                  key={sub.id}
                  className={`flex flex-col p-3 rounded-md ${
                    isGhost ? "bg-slate-800/80" : "bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <Image
                          src={logoUrl}
                          alt={`${sub.name} logo`}
                          width={36}
                          height={36}
                          className="rounded"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-md bg-slate-700 flex items-center justify-center text-xs font-bold">
                          {sub.name ? sub.name.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}

                      <div>
                        <span className="font-semibold">{sub.name}</span>
                        {isGhost && (
                          <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded-full bg-slate-700 text-cyan-200 font-medium">
                            Planejado
                          </span>
                        )}
                        <div className="text-xs text-slate-400 mt-0.5">
                          {sub.category}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-green-400">
                        {valueNumber.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {sub.cycle === "annually" ? "Anual" : "Mensal"}
                      </div>
                    </div>
                  </div>

                  {}
                  {sub.description && (
                    <p className="text-xs text-slate-400 mt-3 border-l-2 border-slate-600 pl-3">
                      {sub.description}
                    </p>
                  )}
                </div>
              );
            })}

            {subsForSelectedDate.length === 0 && (
              <p className="text-sm text-slate-400 px-3">
                Nenhuma cobrança encontrada para este dia.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
