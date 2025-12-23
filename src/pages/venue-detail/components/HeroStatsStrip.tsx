type HeroStatsStripProps = {
  totalCatches: number;
  recentWindow: number;
  recordWeightLabel: string | null;
  topSpeciesLabel: string | null;
};

const HeroStatsStrip = ({
  totalCatches,
  recentWindow,
  recordWeightLabel,
  topSpeciesLabel,
}: HeroStatsStripProps) => (
  <section className="relative z-10 pb-6 pt-5 md:pb-8 md:pt-6">
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 shadow-sm sm:px-4">
      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <a
          href="#catches"
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            Total Catches
          </span>
          <span className="text-lg font-semibold text-blue-700 tabular-nums sm:text-xl">
            {totalCatches}
          </span>
        </a>
        <a
          href="#catches"
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            Last 30 Days
          </span>
          <span className="text-lg font-semibold text-emerald-600 tabular-nums sm:text-xl">
            {recentWindow}
          </span>
        </a>
        <a
          href="#stats"
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            Venue Record
          </span>
          <span className="text-lg font-semibold text-amber-600 tabular-nums sm:text-xl">
            {recordWeightLabel ?? "Record pending"}
          </span>
        </a>
        <a
          href="#stats"
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            Top Species
          </span>
          <span
            className="w-full truncate text-lg font-semibold text-indigo-600 sm:text-xl"
            title={topSpeciesLabel ?? "Mixed stock"}
          >
            {topSpeciesLabel ?? "Mixed stock"}
          </span>
        </a>
      </div>
    </div>
  </section>
);

export default HeroStatsStrip;
