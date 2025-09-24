"use client";

import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

interface AchievementCardProps {
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
}

export function AchievementCard({
  name,
  description,
  icon,
  isUnlocked,
}: AchievementCardProps) {
  const LucideIcon =
    (Icons as Record<string, React.ElementType>)[icon] || Icons.Award;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-all duration-300",
        isUnlocked
          ? "bg-green-500/10 border-green-400/20"
          : "bg-slate-800/50 border-slate-700/50 opacity-50"
      )}
    >
      <div
        className={cn(
          "p-2 rounded-md",
          isUnlocked
            ? "bg-green-500/20 text-green-400"
            : "bg-slate-700 text-slate-500"
        )}
      >
        {}
        <LucideIcon className="h-6 w-6" />
      </div>
      <div>
        <h4 className="font-bold text-white">{name}</h4>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}
