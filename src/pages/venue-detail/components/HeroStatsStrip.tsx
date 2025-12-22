type HeroStatsStripProps = {
  totalCatches: number;
  recentWindow: number;
  recordWeightLabel: string | null;
};

const HeroStatsStrip = ({
  totalCatches,
  recentWindow,
  recordWeightLabel,
}: HeroStatsStripProps) => (
  <section className="relative z-10 -mt-8 pb-6 pt-4 md:-mt-10 md:pb-8 md:pt-6">
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 shadow-sm sm:px-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <a
          href="#catches"
          className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
            Total Catches
          </span>
          <span className="text-lg font-semibold text-slate-900 tabular-nums sm:text-xl">
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
          <span className="text-lg font-semibold text-slate-900 tabular-nums sm:text-xl">
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
          <span className="text-lg font-semibold text-slate-900 tabular-nums sm:text-xl">
            {recordWeightLabel ?? "Record pending"}
          </span>
        </a>
      </div>
    </div>
  </section>
);

export default HeroStatsStrip;
