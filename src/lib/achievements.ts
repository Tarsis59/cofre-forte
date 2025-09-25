// Arquivo: src/lib/achievements.ts (VERSÃO CORRIGIDA E MAIS SEGURA)

import { IconName } from "@/components/dynamic-icon"; // 1. Importamos nosso tipo

// 2. Criamos uma interface para garantir a estrutura correta
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: IconName; // 3. O ícone AGORA PRECISA ser um dos nomes válidos
}

// 4. Aplicamos a interface ao nosso array
export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_step',
    name: 'Primeiro Passo',
    description: 'Você cadastrou sua primeira assinatura!',
    icon: 'Footprints',
  },
  {
    id: 'organizer',
    name: 'Organizador',
    description: 'Cadastrou 5 ou mais assinaturas.',
    icon: 'ListChecks',
  },
  {
    id: 'big_spender',
    name: 'Investidor de Peso',
    description: 'Seu gasto mensal ultrapassou R$ 200.',
    icon: 'TrendingUp',
  },
  {
    id: 'visionary',
    name: 'Visionário',
    description: 'Você visitou o Calendário de Cobranças.',
    icon: 'Eye',
  },
  {
    id: 'simulator',
    name: 'Estrategista',
    description: 'Você usou o Modo Simulação pela primeira vez.',
    icon: 'BrainCircuit',
  },
  {
    id: 'master_economist',
    name: 'Mestre da Economia',
    description: 'Simulou uma economia de mais de R$ 50 em um mês.',
    icon: 'Award',
  },
];