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

const icons = {
  Footprints,
  ListChecks,
  TrendingUp,
  Eye,
  BrainCircuit,
  Award,
};

// Garantimos que este tipo seja exportado para ser usado em outros lugares
export type IconName = keyof typeof icons;

interface DynamicIconProps extends LucideProps {
  name: IconName;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const IconComponent = icons[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent {...props} />;
}