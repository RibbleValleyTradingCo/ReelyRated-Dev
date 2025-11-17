import { memo } from "react";
import { ResponsiveBar } from "@nivo/bar";
import type { Theme } from "@nivo/core";

interface BarChartData {
  label: string;
  catches: number;
}

interface DistributionBarChartProps {
  data: BarChartData[];
  theme: Theme;
  color: string;
  gradientId: string;
  layout?: "horizontal" | "vertical";
  height?: string;
  tickRotation?: number;
}

export const DistributionBarChart = memo(({
  data,
  theme,
  color,
  gradientId,
  layout = "vertical",
  height = "h-64",
  tickRotation = 0,
}: DistributionBarChartProps) => {
  const isHorizontal = layout === "horizontal";

  return (
    <div className={`${height} w-full`}>
      <ResponsiveBar
        data={isHorizontal ? [...data].reverse() : data}
        keys={["catches"]}
        indexBy="label"
        layout={layout}
        margin={
          isHorizontal
            ? { top: 24, right: 24, bottom: 16, left: 160 }
            : { top: 24, right: 16, bottom: 40, left: 42 }
        }
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
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          ...(tickRotation !== 0 ? { legendOffset: 32, tickRotation } : {}),
        }}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        enableGridX={isHorizontal}
        enableGridY={!isHorizontal}
        gridYValues={5}
        borderRadius={6}
        enableLabel={false}
        tooltip={({ indexValue, value }) => (
          <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
            <p className="font-medium">{indexValue}</p>
            <p>{value} catches</p>
          </div>
        )}
        animate={false}
      />
    </div>
  );
});

DistributionBarChart.displayName = "DistributionBarChart";
