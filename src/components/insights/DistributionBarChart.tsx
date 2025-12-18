import { memo, useMemo } from "react";
import { ResponsiveBar } from "@nivo/bar";
import type { PartialTheme } from "@nivo/theming";
import { cn } from "@/lib/utils";

interface BarChartData {
  label: string;
  catches: number;
}

interface DistributionBarChartProps {
  data: BarChartData[];
  theme: PartialTheme;
  color: string;
  gradientId: string;
  layout?: "horizontal" | "vertical";
  height?: string;
  tickRotation?: number;
  maxItems?: number;
}

export const DistributionBarChart = memo(({
  data,
  theme,
  color,
  gradientId,
  layout = "vertical",
  height = "h-64",
  tickRotation = 0,
  maxItems,
}: DistributionBarChartProps) => {
  const isHorizontal = layout === "horizontal";
  const trimmedData = useMemo(() => {
    const sliced = maxItems ? data.slice(0, maxItems) : data;
    return sliced.map((entry) => ({
      ...entry,
      __fullLabel: entry.label,
      label: entry.label.length > 18 ? `${entry.label.slice(0, 15)}…` : entry.label,
    }));
  }, [data, maxItems]);
  const longestLabelLength = useMemo(
    () => trimmedData.reduce((max, entry) => Math.max(max, entry.__fullLabel?.length ?? entry.label.length), 0),
    [trimmedData],
  );

  const verticalBottomMargin = useMemo(() => {
    const base = tickRotation !== 0 ? 72 : 56;
    const labelPadding = Math.min(140, Math.max(56, longestLabelLength * 6));
    return Math.max(base, labelPadding);
  }, [longestLabelLength, tickRotation]);

  const horizontalLeftMargin = useMemo(() => {
    const lengthBased = longestLabelLength > 0 ? longestLabelLength * 8 : 140;
    return Math.min(260, Math.max(140, lengthBased));
  }, [longestLabelLength]);

  const margin = isHorizontal
    ? { top: 24, right: 24, bottom: 32, left: horizontalLeftMargin }
    : { top: 24, right: 16, bottom: verticalBottomMargin, left: 48 };

  return (
    <div
      className={cn(
        "w-full overflow-visible pb-6",
        isHorizontal ? "min-h-[280px]" : "min-h-[260px]",
        height,
      )}
    >
      <ResponsiveBar
        data={isHorizontal ? [...trimmedData].reverse() : trimmedData}
        keys={["catches"]}
        indexBy="label"
        layout={layout}
        margin={margin}
        padding={isHorizontal ? 0.32 : 0.4}
        theme={theme}
        colors={[color]}
        defs={[
          {
            id: gradientId,
            type: "linearGradient",
            colors: [
              { offset: 0, color, opacity: 0.85 },
              { offset: 100, color, opacity: 0.25 },
            ],
          },
        ]}
        fill={[{ match: "*", id: gradientId }]}
        axisTop={null}
        axisRight={null}
        axisBottom={isHorizontal ? null : {
          tickSize: 0,
          tickPadding: 8,
          ...(tickRotation !== 0 ? { legendOffset: 32, tickRotation } : {}),
        }}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        enableGridX={isHorizontal}
        enableGridY={!isHorizontal}
        gridYValues={5}
        borderRadius={6}
        enableLabel={isHorizontal}
        label={isHorizontal ? (datum) => `${Math.round(Number(datum.value ?? 0))}` : undefined}
        labelSkipWidth={0}
        labelSkipHeight={0}
        labelTextColor={isHorizontal ? "#0f172a" : undefined}
        tooltip={({ indexValue, value, data }) => (
          <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
            <p className="font-medium">{(data.__fullLabel as string) ?? indexValue}</p>
            <p>{value} catches</p>
          </div>
        )}
        animate={false}
      />
    </div>
  );
});

DistributionBarChart.displayName = "DistributionBarChart";
