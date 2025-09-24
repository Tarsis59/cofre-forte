"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface CategoryChartProps {
  data: ChartData[];
  onSliceClick?: (category: string) => void;
}

export function CategoryChart({ data, onSliceClick }: CategoryChartProps) {
  const renderLegend = (props: any) => {
    const payload = props?.payload ?? [];
    if (!Array.isArray(payload) || payload.length === 0) return null;

    return (
      <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-300 mt-4">
        {payload.map((entry: any, index: number) => {
          const entryName =
            entry?.value ?? entry?.payload?.name ?? `Item ${index + 1}`;

          const dataPoint =
            data.find((d) => d.name === entryName) ??
            (entry?.payload
              ? data.find((d) => d.name === entry.payload.name)
              : undefined);

          const formattedValue = dataPoint
            ? dataPoint.value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })
            : "";

          const color = entry?.color ?? dataPoint?.color ?? "#8884d8";

          return (
            <li
              key={`legend-item-${index}`}
              className="grid grid-cols-2 items-center"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{entryName}</span>
              </div>
              <span className="font-semibold justify-self-end">
                {formattedValue}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
        Nenhuma assinatura encontrada para exibir no gráfico.
      </div>
    );
  }

  const normalized = data.map((d) => ({
    name: d.name,
    value: typeof d.value === "number" ? d.value : Number(d.value || 0),
    color: d.color || "#8884d8",
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Tooltip
          cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
          contentStyle={{
            backgroundColor: "#1e293b",
            borderColor: "#334155",
            borderRadius: "0.5rem",
          }}
          labelStyle={{ color: "#cbd5e1" }}
          formatter={(value: number) =>
            value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          }
        />

        <Legend content={renderLegend} verticalAlign="bottom" />

        <Pie
          data={normalized}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          innerRadius={60}
          paddingAngle={5}
          dataKey="value"
          nameKey="name"
          className="cursor-pointer"
          onClick={(slice: any, index: number) => {
            if (!onSliceClick) return;
            const maybeName =
              slice?.name ??
              slice?.payload?.name ??
              slice?.value ??
              normalized[index]?.name;
            if (typeof maybeName === "string") onSliceClick(maybeName);
          }}
          isAnimationActive
        >
          {normalized.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              className="focus:outline-none"
              stroke="#0b1220"
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export default CategoryChart;
