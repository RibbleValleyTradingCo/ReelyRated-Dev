type HeroStatsStripProps = {
  totalCatches: number | null;
  recentWindow: number | null;
  recordWeightLabel: string | null;
  topSpeciesLabel: string | null;
};

const HeroStatsStrip = ({
  totalCatches,
  recentWindow,
  recordWeightLabel,
  topSpeciesLabel,
}: HeroStatsStripProps) => {
  const totalValue = totalCatches ?? "—";
  const recentValue = recentWindow ?? "—";

  return (
    <section className="relative z-10 pb-6 pt-5 md:pb-8 md:pt-6">
      <div className="rounded-2xl border border-border bg-card/90 px-3 py-3 shadow-card sm:px-4">
        <div className="flex flex-wrap justify-center gap-2 text-center">
          <a
            href="#catches"
            className="focus-ring flex min-w-[140px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-muted/50"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              Total Catches
            </span>
            <span className="text-lg font-semibold text-primary tabular-nums sm:text-xl">
              {totalValue}
            </span>
          </a>
          <a
            href="#catches"
            className="focus-ring flex min-w-[140px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-muted/50"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              Last 30 Days
            </span>
            <span className="text-lg font-semibold text-secondary tabular-nums sm:text-xl">
              {recentValue}
            </span>
          </a>
          <a
            href="#stats"
            className="focus-ring flex min-w-[140px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-muted/50"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              Venue Record
            </span>
            <span className="text-lg font-semibold text-accent tabular-nums sm:text-xl">
              {recordWeightLabel ?? "Record pending"}
            </span>
          </a>
          <a
            href="#stats"
            className="focus-ring flex min-w-[140px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-muted/50"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              Top Species
            </span>
            <span
              className="w-full truncate text-lg font-semibold text-primary sm:text-xl"
              title={topSpeciesLabel ?? "Mixed stock"}
            >
              {topSpeciesLabel ?? "Mixed stock"}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroStatsStrip;
