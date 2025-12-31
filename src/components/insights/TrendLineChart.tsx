import { memo, useId } from "react";
import { ResponsiveLine } from "@nivo/line";
import type { PartialTheme } from "@nivo/theming";

interface TrendLineChartProps {
  data: Array<{
    id: string;
    data: Array<{ x: string; y: number }>;
  }>;
  theme: PartialTheme;
  color: string;
  gradientId: string;
  ariaLabel?: string;
  ariaDescription?: string;
}

export const TrendLineChart = memo(({
  data,
  theme,
  color,
  gradientId,
  ariaLabel = "Catch trend line chart",
  ariaDescription = "Catch count over time for the selected filters and date range.",
}: TrendLineChartProps) => {
  const descriptionId = useId();

  return (
    <div
      className="h-72 w-full rounded-xl border border-border/60 bg-muted/40 p-2"
      role="img"
      aria-label={ariaLabel}
      aria-describedby={ariaDescription ? descriptionId : undefined}
    >
      {ariaDescription ? <span id={descriptionId} className="sr-only">{ariaDescription}</span> : null}
      <ResponsiveLine
        data={data}
        theme={theme}
        colors={[color]}
        margin={{ top: 24, right: 24, bottom: 40, left: 48 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, stacked: false, nice: true }}
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
        pointBorderColor="hsl(var(--muted))"
        enableGridX={false}
        enableGridY
        gridYValues={5}
        useMesh
        animate={false}
        tooltip={({ point }) => (
          <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-overlay">
            <p className="font-medium">{point.data.xFormatted}</p>
            <p>{point.data.yFormatted} catches</p>
          </div>
        )}
      />
    </div>
  );
});

TrendLineChart.displayName = "TrendLineChart";
