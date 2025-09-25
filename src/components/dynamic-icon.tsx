// Arquivo: src/components/dynamic-icon.tsx

import {
    Award,
    BrainCircuit,
    Eye,
    Footprints,
    ListChecks,
    LucideProps,
    TrendingUp,
} from "lucide-react";

// Mapeamos os nomes dos ícones (texto) para os componentes reais
const icons = {
  Footprints,
  ListChecks,
  TrendingUp,
  Eye,
  BrainCircuit,
  Award,
};

// Definimos o tipo para os nomes dos nossos ícones
export type IconName = keyof typeof icons;

interface DynamicIconProps extends LucideProps {
  name: IconName;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const IconComponent = icons[name];

  // Se o ícone não for encontrado, não renderiza nada para evitar erros
  if (!IconComponent) {
    return null;
  }

  return <IconComponent {...props} />;
}