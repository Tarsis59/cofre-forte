"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import CountUp from "react-countup";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  prefix?: string;
  decimals?: number;
  ghostValue?: number;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  prefix = "",
  decimals = 2,
  ghostValue,
}: StatCardProps) {
  const formattedGhost =
    ghostValue && ghostValue > 0
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(ghostValue)
      : null;

  return (
    <Card className="bg-slate-900 border-slate-700/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-500" />
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold text-white">
          <CountUp
            start={0}
            end={value}
            duration={1.5}
            separator="."
            decimal=","
            prefix={prefix}
            decimals={decimals}
            preserveValue={true}
          />
        </div>

        {}
        {formattedGhost ? (
          <p className="text-xs text-cyan-400 animate-pulse">
            + {formattedGhost}{" "}
            <span className="text-slate-400"> (planejado)</span>
          </p>
        ) : (
          <p className="text-xs text-slate-500 h-4">{description ?? ""}</p>
        )}
      </CardContent>
    </Card>
  );
}
