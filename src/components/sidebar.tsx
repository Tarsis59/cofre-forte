"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { signOut, User } from "firebase/auth";
import { Calendar, Home, LineChart, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatedGradientText } from "./animated-gradient-text";
import { GlobalSearchBar } from "./global-search-bar";

interface SidebarProps {
  user: User;
  unlockedAchievements: Set<string>;
  onClose?: () => void;
}

export function Sidebar({ user, unlockedAchievements, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/calendar", label: "Calendário", icon: Calendar },
    { href: "/reports", label: "Relatórios", icon: LineChart },
  ];

  return (
    <aside
      className="w-64 h-full flex flex-col bg-slate-900 text-white border-r border-slate-700/50 p-4"
      aria-label="Sidebar"
    >
      {}
      <div className="flex items-center gap-2 pb-4 border-b border-slate-700/50">
        <AnimatedGradientText
          text="Cofre Forte"
          className="text-xl font-bold"
        />
      </div>

      {}
      <div className="mt-6">
        <GlobalSearchBar />
      </div>

      {}
      <nav className="flex-1 mt-4" aria-label="Main navigation">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} onClick={() => onClose?.()}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-slate-800 text-green-400 font-semibold"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {}
      <div className="pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-slate-600 flex-shrink-0">
            {user.photoURL ? (
              <AvatarImage
                src={user.photoURL}
                alt={user.displayName ?? user.email ?? "Usuário"}
              />
            ) : (
              <AvatarFallback>
                {(user.displayName || user.email || "U").charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>

          {}
          <div className="flex-1 min-w-0">
            {}
            <p className="text-sm font-semibold text-white truncate">
              {user.displayName ?? user.email}
            </p>

            {}
            <div className="mt-1 flex items-center justify-between">
              <button
                onClick={handleSignOut}
                className="text-xs text-slate-400 hover:text-white hover:underline focus:outline-none"
              >
                Sair
              </button>

              {}
              <button
                onClick={handleSignOut}
                className="text-slate-400 hover:text-red-400 p-1 rounded-md focus:outline-none"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
