export const createNivoTheme = (borderColor: string) => ({
  textColor: "hsl(var(--foreground))",
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
        fill: "hsl(var(--foreground))",
      },
    },
    legend: {
      text: {
        fill: "hsl(var(--foreground))",
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
      fill: "hsl(var(--foreground))",
    },
  },
  tooltip: {
    container: {
      background: "hsl(var(--popover))",
      color: "hsl(var(--popover-foreground))",
      borderRadius: 8,
      border: "1px solid hsl(var(--border))",
      boxShadow: "var(--shadow-overlay)",
      padding: "0.5rem 0.75rem",
    },
  },
});
