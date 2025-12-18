export const createNivoTheme = (borderColor: string) => ({
  textColor: "var(--muted-foreground)",
  fontSize: 12,
  axis: {
    domain: {
      line: {
        stroke: borderColor,
      },
    },
    ticks: {
      line: {
        stroke: borderColor,
      },
      text: {
        fill: "var(--muted-foreground)",
      },
    },
    legend: {
      text: {
        fill: "var(--muted-foreground)",
      },
    },
  },
  grid: {
    line: {
      stroke: borderColor,
    },
  },
  legends: {
    text: {
      fill: "var(--muted-foreground)",
    },
  },
  tooltip: {
    container: {
      background: "hsl(var(--popover))",
      color: "hsl(var(--popover-foreground))",
      borderRadius: 8,
      border: "1px solid hsl(var(--border))",
      boxShadow: "0 12px 40px rgba(15, 23, 42, 0.15)",
      padding: "0.5rem 0.75rem",
    },
  },
});
