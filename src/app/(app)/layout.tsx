"use client";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AnimatedGradientText } from "@/components/animated-gradient-text";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { SearchProvider } from "@/contexts/search-context";
import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { Toaster } from "react-hot-toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const achievementsQuery = query(
          collection(db, "users", currentUser.uid, "achievements")
        );
        const unsubscribeAchievements = onSnapshot(
          achievementsQuery,
          (snapshot) => {
            const unlockedData = snapshot.docs.map(
              (doc) => doc.data().achievementId
            );
            setUnlockedAchievements(new Set(unlockedData));
            setLoading(false);
          }
        );

        return () => unsubscribeAchievements();
      } else {
        setUser(null);
        setLoading(false);
        router.push("/");
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <p className="text-white animate-pulse">Carregando Cofre Forte...</p>
      </div>
    );
  }

  if (user) {
    return (
      <SearchProvider>
        <div className="flex min-h-screen relative bg-slate-950">
          {}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                border: "1px solid #334155",
                padding: "16px",
                color: "#f8fafc",
                backgroundColor: "#1e293b",
              },
            }}
          />

          {}
          <div className="hidden md:flex">
            <Sidebar user={user} unlockedAchievements={unlockedAchievements} />
          </div>

          {}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 z-40 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="fixed inset-y-0 left-0 z-50 md:hidden"
                >
                  <Sidebar
                    user={user}
                    unlockedAchievements={unlockedAchievements}
                    onClose={() => setSidebarOpen(false)}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {}
          <div className="flex flex-1 flex-col w-full md:w-auto">
            {}
            <header className="md:hidden flex items-center justify-between bg-slate-900/95 backdrop-blur-sm sticky top-0 z-30 p-3 border-b border-slate-700/50">
              <AnimatedGradientText
                text="Cofre Forte"
                className="text-lg font-bold"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="text-white"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </header>

            <main className="flex-1 p-4 sm:p-6 md:p-8 text-white">
              {children}
            </main>
          </div>
        </div>
      </SearchProvider>
    );
  }

  return null;
}
