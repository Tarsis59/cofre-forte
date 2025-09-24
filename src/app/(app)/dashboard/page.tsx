"use client";

import { auth, db } from "@/lib/firebase";
import { Subscription } from "@/types";
import { useEffect, useMemo, useState } from "react";

import {
  collection,
  doc,
  onSnapshot,
  query,
  writeBatch,
} from "firebase/firestore";

import { useSearch } from "@/contexts/search-context";

import { AchievementCard } from "@/components/achievement-card";
import { AddSubscriptionModal } from "@/components/add-subscription-modal";
import { AnimatedGradientText } from "@/components/animated-gradient-text";
import { CategoryChart } from "@/components/category-chart";
import { GhostSubscriptionList } from "@/components/ghost-subscription-list";
import { StatCard } from "@/components/stat-card";
import { SubscriptionList } from "@/components/subscription-list";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  ArrowDownUp,
  DollarSign,
  Ghost,
  ListChecks,
  PlusCircle,
  SortAsc,
  SortDesc,
  TrendingUp,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import toast from "react-hot-toast";

import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bar,
  BarChart,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const CATEGORY_COLORS: { [key: string]: string } = {
  Streaming: "#00C49F",
  Trabalho: "#0088FE",
  "Bem-estar": "#FFBB28",
  Jogos: "#FF8042",
  Outro: "#A9A9A9",
};

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);

  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [deactivatedIds, setDeactivatedIds] = useState<Set<string>>(new Set());

  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"billingDate" | "value" | "name">(
    "billingDate"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { searchQuery } = useSearch();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    const subsQuery = query(
      collection(db, "users", currentUser.uid, "subscriptions")
    );
    const achievementsQuery = query(
      collection(db, "users", currentUser.uid, "achievements")
    );

    const unsubscribeSubs = onSnapshot(subsQuery, (snapshot) => {
      const subsData = snapshot.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) } as Subscription)
      );
      setSubscriptions(subsData);

      checkAchievements(subsData, unlockedAchievements).catch((err) => {
        console.error("Erro ao checar conquistas:", err);
      });

      setIsLoading(false);
    });

    const unsubscribeAchievements = onSnapshot(
      achievementsQuery,
      (snapshot) => {
        const unlockedData = snapshot.docs
          .map((d) => (d.data() as any).achievementId)
          .filter(Boolean);
        setUnlockedAchievements(new Set(unlockedData));
      }
    );

    return () => {
      unsubscribeSubs();
      unsubscribeAchievements();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAchievements = async (
    currentSubs: Subscription[],
    currentAchievements: Set<string>
  ) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const newAchievementsToGrant: string[] = [];
    const activeRealSubs = currentSubs.filter((s) => s.isActive && !s.isGhost);

    const calculateUserShare = (sub: Subscription) => {
      const valueNumber =
        typeof sub.value === "number" ? sub.value : Number(sub.value ?? 0);
      const sharedCount =
        sub.sharedWithCount && sub.sharedWithCount > 0
          ? sub.sharedWithCount
          : 1;
      return valueNumber / sharedCount;
    };

    const monthlySpending = activeRealSubs.reduce((acc, sub) => {
      const userShare = calculateUserShare(sub);
      return acc + (sub.cycle === "annually" ? userShare / 12 : userShare);
    }, 0);

    if (currentSubs.length > 0 && !currentAchievements.has("first_step")) {
      newAchievementsToGrant.push("first_step");
    }

    if (currentSubs.length >= 5 && !currentAchievements.has("organizer")) {
      newAchievementsToGrant.push("organizer");
    }

    if (monthlySpending > 200 && !currentAchievements.has("big_spender")) {
      newAchievementsToGrant.push("big_spender");
    }

    if (newAchievementsToGrant.length > 0) {
      const batch = writeBatch(db);
      newAchievementsToGrant.forEach((achId) => {
        const achievementRef = doc(
          db,
          "users",
          currentUser.uid,
          "achievements",
          achId
        );
        batch.set(achievementRef, {
          achievementId: achId,
          unlockedAt: new Date(),
        });
      });

      await batch.commit();

      newAchievementsToGrant.forEach((achId) => {
        const achievementData = ALL_ACHIEVEMENTS.find((a) => a.id === achId);
        if (achievementData)
          toast.success(`Conquista Desbloqueada: ${achievementData.name}!`);
      });
    }
  };

  const getTimeFromBillingDate = (billingDate: any) => {
    if (!billingDate) return 0;
    if (typeof billingDate?.toMillis === "function")
      return billingDate.toMillis();
    if (billingDate instanceof Date) return billingDate.getTime();
    if (typeof billingDate === "number") return billingDate;
    const parsed = Date.parse(billingDate);
    return isNaN(parsed) ? 0 : parsed;
  };

  const {
    monthlySpending,
    annualForecast,
    totalSubscriptions,
    chartData,
    processedSubscriptions,
    realSubsForDisplay,
    ghostSubs,

    mostExpensiveSub,
    topCategory,
    subCounts,
    forecastData,
  } = useMemo(() => {
    const activeSubs = subscriptions.filter((s) => s.isActive);

    const realSubsAll = activeSubs.filter((s) => !s.isGhost);
    const ghostSubs = activeSubs.filter((s) => !!s.isGhost);

    const calculateUserShare = (sub: Subscription) => {
      const valueNumber =
        typeof sub.value === "number" ? sub.value : Number(sub.value ?? 0);
      const sharedCount =
        sub.sharedWithCount && sub.sharedWithCount > 0
          ? sub.sharedWithCount
          : 1;
      return valueNumber / sharedCount;
    };

    const subsToCalculate = isSimulationMode
      ? realSubsAll.filter((s) => !deactivatedIds.has(s.id))
      : realSubsAll;

    const totalMonthly = subsToCalculate.reduce((acc, sub) => {
      const userShare = calculateUserShare(sub);
      const monthlyValue =
        sub.cycle === "annually" ? userShare / 12 : userShare;
      return acc + monthlyValue;
    }, 0);

    const totalAnnual = subsToCalculate.reduce((acc, sub) => {
      const userShare = calculateUserShare(sub);
      const annualValue = sub.cycle === "monthly" ? userShare * 12 : userShare;
      return acc + annualValue;
    }, 0);

    const dataForChart = Object.entries(
      realSubsAll.reduce((acc, sub) => {
        const userShare = calculateUserShare(sub);
        const monthlyValue =
          sub.cycle === "annually" ? userShare / 12 : userShare;
        const category = sub.category || "Outro";
        acc[category] = (acc[category] || 0) + monthlyValue;
        return acc;
      }, {} as { [key: string]: number })
    ).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || CATEGORY_COLORS["Outro"],
    }));

    const filteredForDisplay = filterCategory
      ? realSubsAll.filter((s) => (s.category || "Outro") === filterCategory)
      : realSubsAll;

    const sortedForDisplay = [...filteredForDisplay].sort((a, b) => {
      let compareA: any;
      let compareB: any;

      if (sortBy === "billingDate") {
        compareA = getTimeFromBillingDate(a.billingDate);
        compareB = getTimeFromBillingDate(b.billingDate);
      } else if (sortBy === "value") {
        compareA = calculateUserShare(a);
        compareB = calculateUserShare(b);
      } else {
        compareA = a.name?.toLowerCase?.() ?? "";
        compareB = b.name?.toLowerCase?.() ?? "";
      }

      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const searchedForDisplay = searchQuery
      ? sortedForDisplay.filter((s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : sortedForDisplay;

    const ghostMonthlySpending = ghostSubs.reduce((acc, sub) => {
      const userShare = calculateUserShare(sub);
      const monthlyValue =
        sub.cycle === "annually" ? userShare / 12 : userShare;
      return acc + monthlyValue;
    }, 0);

    const ghostAnnualForecast = ghostSubs.reduce((acc, sub) => {
      const userShare = calculateUserShare(sub);
      const annualValue = sub.cycle === "monthly" ? userShare * 12 : userShare;
      return acc + annualValue;
    }, 0);

    const mostExpensiveSub = realSubsAll
      .map((s) => ({ sub: s, userShare: calculateUserShare(s) }))
      .sort((a, b) => b.userShare - a.userShare)[0]?.sub;

    const categorySpending = realSubsAll.reduce((acc, sub) => {
      const monthlyValue =
        sub.cycle === "annually"
          ? calculateUserShare(sub) / 12
          : calculateUserShare(sub);
      const category = sub.category || "Outro";
      acc[category] = (acc[category] || 0) + monthlyValue;
      return acc;
    }, {} as Record<string, number>);
    const topCategory =
      Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0] || null;

    const subCounts = realSubsAll.reduce((acc, sub) => {
      acc[sub.cycle] = (acc[sub.cycle] || 0) + 1;
      return acc;
    }, {} as { monthly?: number; annually?: number });

    const forecastData: { name: string; Gasto: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const targetMonth = addMonths(now, i);
      let monthTotal = 0;
      realSubsAll.forEach((sub) => {
        const monthlyValue =
          sub.cycle === "annually"
            ? calculateUserShare(sub) / 12
            : calculateUserShare(sub);
        monthTotal += monthlyValue;
      });
      forecastData.push({
        name: format(targetMonth, "MMM", { locale: ptBR }),
        Gasto: Number(monthTotal.toFixed(2)),
      });
    }

    return {
      monthlySpending: totalMonthly,
      annualForecast: totalAnnual,
      totalSubscriptions: subsToCalculate.length,
      chartData: dataForChart,
      processedSubscriptions: searchedForDisplay,
      realSubsForDisplay: realSubsAll,
      ghostSubs,

      mostExpensiveSub,
      topCategory,
      subCounts,
      forecastData,
    };
  }, [
    subscriptions,
    filterCategory,
    sortBy,
    sortOrder,
    searchQuery,
    isSimulationMode,
    deactivatedIds,
  ]);

  const handleToggleDeactivated = (subId: string) => {
    setDeactivatedIds((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  const handleChartSliceClick = (categoryName: string) => {
    setFilterCategory((prev) => (prev === categoryName ? null : categoryName));
  };

  if (isLoading) return <DashboardLoadingSkeleton />;

  return (
    <div className="flex flex-col gap-8 p-4">
      {}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 flex justify-center text-center order-1 sm:order-none">
          <div>
            <AnimatedGradientText
              text="Dashboard"
              className="text-3xl sm:text-4xl font-bold tracking-tighter"
            />
            <p className="text-slate-400 mt-2 text-sm sm:text-base">
              Seja bem-vindo(a) ao seu centro de controle financeiro!
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="simulation-mode"
                    checked={isSimulationMode}
                    onCheckedChange={(v) => {
                      setIsSimulationMode(v);
                      if (!v) setDeactivatedIds(new Set());
                    }}
                  />
                  <Label htmlFor="simulation-mode" className="text-white">
                    Modo Simulação
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Desative assinaturas para ver sua economia em tempo real.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <AddSubscriptionModal
            trigger={
              <Button className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Assinatura
              </Button>
            }
          />
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={
            filterCategory ? `Gasto Mensal (${filterCategory})` : "Gasto Mensal"
          }
          value={monthlySpending}
          icon={DollarSign}
          prefix="R$ "
          ghostValue={ghostSubs.reduce(
            (acc, s) =>
              acc +
              (s.sharedWithCount && s.sharedWithCount > 0
                ? s.value / s.sharedWithCount
                : s.value) *
                (s.cycle === "annually" ? 1 / 12 : 1),
            0
          )}
          backContent={
            <div className="text-xs space-y-2">
              <p>
                Mais cara:{" "}
                <span className="font-bold">
                  {mostExpensiveSub?.name ?? "N/A"}
                </span>
              </p>
              <p>
                Top Categoria:{" "}
                <span className="font-bold">{topCategory?.[0] ?? "N/A"}</span>
              </p>
            </div>
          }
        />

        <StatCard
          title="Previsão Anual"
          value={annualForecast}
          icon={TrendingUp}
          prefix="R$ "
          ghostValue={ghostSubs.reduce(
            (acc, s) =>
              acc +
              (s.sharedWithCount && s.sharedWithCount > 0
                ? s.value / s.sharedWithCount
                : s.value) *
                (s.cycle === "monthly" ? 12 : 1),
            0
          )}
          backContent={
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={forecastData}
                  margin={{ top: 6, right: 0, left: -12, bottom: 0 }}
                >
                  <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
                  <YAxis fontSize={10} stroke="#94a3b8" />
                  <RechartTooltip
                    cursor={{ fill: "rgba(255,255,255,0.06)" }}
                    contentStyle={{ backgroundColor: "#0f172a" }}
                  />
                  <Bar dataKey="Gasto" fill="#00C49F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        />

        <StatCard
          title="Assinaturas Ativas"
          value={totalSubscriptions}
          icon={ListChecks}
          decimals={0}
          description={`${ghostSubs.length} planejadas`}
          backContent={
            <div className="text-xs space-y-2">
              <p>
                <span className="font-bold">{subCounts.monthly ?? 0}</span>{" "}
                Mensais
              </p>
              <p>
                <span className="font-bold">{subCounts.annually ?? 0}</span>{" "}
                Anuais
              </p>
            </div>
          }
        />
      </div>

      {}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-slate-900 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-white">
              Minhas Assinaturas
            </CardTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ArrowDownUp className="h-4 w-4" />
                    <span>
                      {sortBy === "billingDate"
                        ? "Data"
                        : sortBy === "value"
                        ? "Valor"
                        : "Nome"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("billingDate")}>
                    Data
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("value")}>
                    Valor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>
                    Nome
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SubscriptionList
              subscriptions={processedSubscriptions}
              isSimulationMode={isSimulationMode}
              deactivatedIds={deactivatedIds}
              onToggleDeactivated={handleToggleDeactivated}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card className="bg-slate-900 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Gastos por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryChart
                data={chartData}
                onSliceClick={handleChartSliceClick}
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Conquistas ({unlockedAchievements.size}/
                {ALL_ACHIEVEMENTS.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ALL_ACHIEVEMENTS.map((ach) => (
                <AchievementCard
                  key={ach.id}
                  name={ach.name}
                  description={ach.description}
                  icon={ach.icon}
                  isUnlocked={unlockedAchievements.has(ach.id)}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ghost className="h-5 w-5" /> Assinaturas Planejadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GhostSubscriptionList subscriptions={ghostSubs} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse p-4">
      <div className="flex flex-col items-center justify-center gap-4 text-center sm:flex-row sm:justify-between">
        <div>
          <Skeleton className="h-10 w-64 rounded-md" />
          <Skeleton className="h-4 w-80 rounded-md mt-2" />
        </div>
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Skeleton className="col-span-1 lg:col-span-3 h-80 rounded-xl" />
        <Skeleton className="col-span-1 lg:col-span-2 h-80 rounded-xl" />
      </div>
    </div>
  );
}
