"use client";

import { useSearch } from "@/contexts/search-context";
import { Search } from "lucide-react";
import { Input } from "./ui/input";

export function GlobalSearchBar() {
  const { searchQuery, setSearchQuery } = useSearch();

  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
      <Input
        placeholder="Buscar assinatura..."
        className="pl-8"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
