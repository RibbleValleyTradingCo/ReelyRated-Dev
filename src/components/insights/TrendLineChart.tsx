import { memo } from "react";
import { ResponsiveLine } from "@nivo/line";
import type { Theme } from "@nivo/core";

interface TrendLineChartProps {
  data: Array<{
    id: string;
    data: Array<{ x: string; y: number }>;
  }>;
  theme: Theme;
  color: string;
  gradientId: string;
}

export const TrendLineChart = memo(({ data, theme, color, gradientId }: TrendLineChartProps) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveLine
        data={data}
        theme={theme}
        colors={[color]}
        margin={{ top: 24, right: 24, bottom: 40, left: 48 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, stack: false, nice: true }}
        enableArea
        areaBaselineValue={0}
        defs={[
          {
            id: gradientId,
            type: "linearGradient",
            colors: [
              { offset: 0, color, opacity: 0.35 },
              { offset: 100, color, opacity: 0.05 },
            ],
          },
        ]}
        fill={[{ match: "*", id: gradientId }]}
        axisBottom={{ tickSize: 0, tickPadding: 8, legendOffset: 32 }}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        pointSize={8}
        pointColor={color}
        pointBorderWidth={2}
        pointBorderColor="hsl(var(--background))"
        enableGridX={false}
        enableGridY
        gridYValues={5}
        useMesh
        animate={false}
        tooltip={({ point }) => (
          <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
            <p className="font-medium">{point.data.xFormatted}</p>
            <p>{point.data.yFormatted} catches</p>
          </div>
        )}
      />
    </div>
  );
});

TrendLineChart.displayName = "TrendLineChart";
