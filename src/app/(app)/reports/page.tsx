"use client";

import { auth, db } from "@/lib/firebase";
import { Subscription } from "@/types";
import { addMonths, addYears, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { AnimatedGradientText } from "@/components/animated-gradient-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentHistory {
  id: string;
  amount: number;
  paymentDate: { seconds: number; nanoseconds: number } | Date;
  category: string;
}

export default function ReportsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const historyQuery = query(
      collection(db, "users", currentUser.uid, "payment_history"),
      orderBy("paymentDate", "asc")
    );
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PaymentHistory)
      );
      setHistory(historyData);
    });

    const subsQuery = query(
      collection(db, "users", currentUser.uid, "subscriptions")
    );
    const unsubscribeSubs = onSnapshot(subsQuery, (snapshot) => {
      const subsData = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Subscription)
      );
      setSubscriptions(subsData);
      setIsLoading(false);
    });

    return () => {
      unsubscribeHistory();
      unsubscribeSubs();
    };
  }, []);

  const toDate = (val: any): Date => {
    if (!val) return new Date();
    if (typeof val?.toDate === "function") return val.toDate();
    if (val instanceof Date) return val;
    if (typeof val === "number") return new Date(val);
    const parsed = Date.parse(val);
    return isNaN(parsed) ? new Date() : new Date(parsed);
  };

  const { categoryReportData, forecastReportData } = useMemo(() => {
    const activeSubs = subscriptions.filter((s) => s.isActive && !s.isGhost);

    const calculateUserShare = (sub: Subscription) => {
      const valueNumber =
        typeof sub.value === "number" ? sub.value : Number(sub.value ?? 0);
      const sharedCount =
        sub.sharedWithCount && sub.sharedWithCount > 0
          ? sub.sharedWithCount
          : 1;
      return valueNumber / sharedCount;
    };

    const categoryDataMap = activeSubs.reduce(
      (
        acc: Record<string, { name: string; totalCost: number; count: number }>,
        sub
      ) => {
        const monthlyValue =
          sub.cycle === "annually"
            ? calculateUserShare(sub) / 12
            : calculateUserShare(sub);
        const category = sub.category ?? "Outro";
        if (!acc[category])
          acc[category] = { name: category, totalCost: 0, count: 0 };
        acc[category].totalCost += monthlyValue;
        acc[category].count += 1;
        return acc;
      },
      {}
    );

    const categoryReportData = Object.values(categoryDataMap).sort(
      (a, b) => b.totalCost - a.totalCost
    );

    const monthlyForecast: Record<string, number> = {};
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const targetMonth = startOfMonth(addMonths(now, i));
      const monthKey = format(targetMonth, "MMM/yy", { locale: ptBR });
      monthlyForecast[monthKey] = 0;
    }

    activeSubs.forEach((sub) => {
      let nextDate = toDate((sub as any).billingDate);

      for (let i = 0; i < 24; i++) {
        const monthStart = startOfMonth(nextDate);
        const monthKey = format(monthStart, "MMM/yy", { locale: ptBR });
        if (monthlyForecast.hasOwnProperty(monthKey)) {
          const userShare = calculateUserShare(sub);
          monthlyForecast[monthKey] += userShare;
        }
        nextDate =
          sub.cycle === "monthly"
            ? addMonths(nextDate, 1)
            : addYears(nextDate, 1);
      }
    });

    const forecastReportData = Object.entries(monthlyForecast).map(
      ([month, total]) => ({
        month: month.charAt(0).toUpperCase() + month.slice(1),
        "Gasto Previsto": Number(total.toFixed(2)),
      })
    );

    return { categoryReportData, forecastReportData };
  }, [subscriptions]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-12 w-96 rounded-md" />
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center justify-center text-center">
        <AnimatedGradientText
          text="Relatórios Avançados"
          className="text-4xl font-bold tracking-tighter"
        />
        <p className="text-slate-400 mt-2">
          Analise seus dados e entenda suas tendências de gastos.
        </p>
      </div>

      {}
      <Card className="bg-slate-900 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Análise por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={categoryReportData}
              layout="vertical"
              margin={{ left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                type="number"
                stroke="#94a3b8"
                tickFormatter={(value) =>
                  typeof value === "number"
                    ? `R$${value.toFixed(2)}`
                    : `R$${value}`
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                width={120}
              />
              <Tooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                }}
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
              <Bar
                dataKey="totalCost"
                name="Gasto Mensal"
                fill="#00C49F"
                radius={[0, 6, 6, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {}
      <Card className="bg-slate-900 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Previsão de Gastos (Próximos 12 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={forecastReportData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis
                stroke="#94a3b8"
                tickFormatter={(value) =>
                  typeof value === "number"
                    ? `R$${value.toFixed(2)}`
                    : `R$${value}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                }}
                formatter={(value: number) => `R$ ${Number(value).toFixed(2)}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Gasto Previsto"
                stroke="#0088FE"
                strokeWidth={2}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
