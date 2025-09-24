// Arquivo: src/types/index.ts

import { Timestamp } from "firebase/firestore";

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  value: number;
  cycle: "monthly" | "annually";
  billingDate: Timestamp;
  category: "Streaming" | "Trabalho" | "Bem-estar" | "Jogos" | "Outro";
  logoUrl?: string;
  isActive: boolean;
  createdAt: Timestamp;
  description?: string;
  sharedWithCount?: number;
  isGhost?: boolean;
}
