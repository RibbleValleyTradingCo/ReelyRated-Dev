import { useAuth } from "@/components/AuthProvider";
import { HeroLeaderboardSpotlight } from "@/components/HeroLeaderboardSpotlight";
import { LeaderboardSection } from "@/components/LeaderboardSection";
import { Button } from "@/components/ui/button";
import { PulsingDot } from "@/components/PulsingDot";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Activity, Camera, Compass, Fish, MapPin, MoveRight, NotebookPen, Star, Users, Waves } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCountUp } from "@/hooks/useCountUp";
import { isAdminUser } from "@/lib/admin";
import PageContainer from "@/components/layout/PageContainer";
import Section from "@/components/layout/Section";
import Heading from "@/components/typography/Heading";
import Text from "@/components/typography/Text";
import Eyebrow from "@/components/typography/Eyebrow";

type FeatureHighlight = {
  title: string;
  description: string;
  icon: LucideIcon;
  supporting?: string;
  href?: string;
};

const featureHighlights: FeatureHighlight[] = [
  {
    title: "Log every catch with precision",
    description:
      "Record weight, species, tactics, conditions and photos in seconds. Everything drops into a searchable logbook you can rely on.",
    icon: NotebookPen,
    href: "/add-catch",
  },
  {
    title: "Climb community scoreboards",
    description:
      "Your catches earn scores based on weight, detail and community ratings, so you can see exactly where you rank on each venue.",
    icon: Users,
    href: "/feed",
  },
  {
    title: "Spot the patterns that catch fish",
    description:
      "See which baits, rigs and methods actually convert into landed fish across different venues, seasons and conditions.",
    icon: Activity,
  },
  {
    title: "Map your proven waters",
    description:
      "Save your favourite venues, swims and pegs with notes and conditions, so you always know where to start on your next session.",
    icon: MapPin,
  },
];

const featureAccents = [
  {
    tile: "bg-gradient-to-br from-primary via-secondary to-accent",
    hoverBorder: "hover:border-primary/40",
    hoverShadow: "hover:shadow-glow",
    headingHover: "group-hover:text-primary",
    linkColor: "text-primary hover:text-primary/80",
    glow: "bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10",
  },
  {
    tile: "bg-gradient-to-br from-secondary via-primary to-accent",
    hoverBorder: "hover:border-secondary/40",
    hoverShadow: "hover:shadow-glow",
    headingHover: "group-hover:text-secondary",
    linkColor: "text-secondary hover:text-secondary/80",
    glow: "bg-gradient-to-br from-secondary/15 via-primary/10 to-accent/10",
  },
  {
    tile: "bg-gradient-to-br from-accent via-secondary to-primary",
    hoverBorder: "hover:border-accent/40",
    hoverShadow: "hover:shadow-glow",
    headingHover: "group-hover:text-accent",
    linkColor: "text-accent hover:text-accent/80",
    glow: "bg-gradient-to-br from-accent/15 via-secondary/10 to-primary/10",
  },
  {
    tile: "bg-gradient-to-br from-primary via-secondary to-accent",
    hoverBorder: "hover:border-primary/40",
    hoverShadow: "hover:shadow-glow",
    headingHover: "group-hover:text-primary",
    linkColor: "text-primary hover:text-primary/80",
    glow: "bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/10",
  },
] as const;
const workflowSteps = [
  {
    title: "Log the catch while you’re on the bank",
    description:
      "Snap a photo, add species, weight and a quick note. ReelyRated timestamps and stores it so you never lose the details.",
    icon: Camera,
    supporting: "Takes about 30 seconds per catch.",
  },
  {
    title: "Share it and get real-world ratings",
    description:
      "Once your catch is live, other anglers score it on detail and quality. Your profile and venue scores update in real time, and standout catches can hit the spotlight and leaderboards.",
    icon: Star,
    supporting: "Ratings happen automatically once it’s live.",
  },
  {
    title: "Turn those sessions into a pattern",
    description:
      "See which tactics, venues and conditions actually work for you in your logbook and insights. Next time out, you’re not guessing – you’re repeating what catches fish.",
    icon: MapPin,
    supporting: "Check your trends in under a minute before you head out.",
  },
];

const stepAccents = [
  {
    badge: "text-primary",
    iconBg: "bg-gradient-to-br from-primary to-secondary text-inverse",
  },
  {
    badge: "text-secondary",
    iconBg: "bg-gradient-to-br from-secondary to-accent text-inverse",
  },
  {
    badge: "text-accent",
    iconBg: "bg-gradient-to-br from-accent to-primary text-inverse",
  },
] as const;

const FeatureHighlights = ({ compact = false, isAdmin = false }: { compact?: boolean; isAdmin?: boolean }) => (
  <div className={cn("space-y-10", compact ? "pt-2" : "pt-6")}>
    <div
      className={cn(
        "space-y-4",
        compact ? "text-left" : "mx-auto max-w-3xl text-center",
      )}
    >
      <Heading
        as="h2"
        size={compact ? "lg" : "xl"}
        className={cn(
          "text-foreground",
          compact && "text-3xl md:text-4xl",
        )}
      >
        Built to remember every day on the water
      </Heading>
      <Text
        className={cn(
          "text-lg leading-relaxed text-muted-foreground",
          compact ? "max-w-xl" : "mx-auto max-w-2xl",
        )}
      >
        From first cast to last light, ReelyRated keeps every detail so you can repeat the days that
        work and fix the ones that don’t.
      </Text>
    </div>

    <div
      className={cn(
        "grid gap-6 md:gap-8",
        compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
      )}
    >
      {featureHighlights.map(({ title, description, supporting, href, icon: Icon }, index) => {
        const accent = featureAccents[index % featureAccents.length];
        const resolvedHref = isAdmin && href === "/add-catch" ? undefined : href;

        if (compact) {
          return (
            <article
              key={title}
              className={cn(
                "group flex items-start gap-4 rounded-2xl border border-border bg-card/90 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover lg:p-6",
                accent.hoverBorder,
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-card/80 shadow-card ring-1 ring-border/50 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110",
                  accent.tile,
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
                {supporting ? (
                  <p className="text-xs font-medium uppercase tracking-wide text-primary/80">
                    {supporting}
                  </p>
                ) : null}
              </div>
            </article>
          );
        }

        return (
          <div
            key={title}
            className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-4 motion-safe:duration-500"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <article
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-3xl border border-border bg-card/95 p-6 shadow-card transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-card-hover sm:p-8",
                accent.hoverBorder,
                accent.hoverShadow,
              )}
            >
              <div className={cn("pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100", accent.glow)} aria-hidden="true" />
              <div className="relative space-y-6">
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl bg-card/80 shadow-card ring-1 ring-border/50 transition-transform duration-300 ease-out group-hover:-rotate-3 group-hover:scale-[1.08]",
                    accent.tile,
                  )}
                >
                  <Icon className="h-8 w-8" />
                </div>
                <div className="space-y-4">
                  <h3
                    className={cn(
                      "text-2xl font-semibold text-foreground transition-colors duration-300 md:text-3xl",
                      accent.headingHover,
                    )}
                  >
                    {title}
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
                  {supporting ? (
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {supporting}
                    </p>
                  ) : null}
                  {resolvedHref ? (
                    resolvedHref.startsWith("/") ? (
                      <Link
                        to={resolvedHref}
                        className={cn(
                          "group/link inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                          accent.linkColor,
                        )}
                      >
                        Learn more
                        <MoveRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" aria-hidden="true" />
                      </Link>
                    ) : (
                      <a
                        href={resolvedHref}
                        className={cn(
                          "group/link inline-flex items-center gap-2 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                          accent.linkColor,
                        )}
                      >
                        Learn more
                        <MoveRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" aria-hidden="true" />
                      </a>
                    )
                  ) : null}
                </div>
              </div>
            </article>
          </div>
        );
      })}
    </div>
  </div>
);

interface StatsShowcaseProps {
  stats: {
    totalCatches: number;
    activeAnglers: number;
    waterways: number;
  };
  isLoading: boolean;
  dataError: string | null;
}

type StatsCardProps = {
  label: string;
  value: number;
  helper: string;
  isLoading: boolean;
  accentGradient: string;
  tileGradient: string;
  icon: LucideIcon;
};

const StatsCard = ({ label, value, helper, isLoading, accentGradient, tileGradient, icon: Icon }: StatsCardProps) => {
  const { count, ref } = useCountUp(isLoading ? 0 : value);
  const display = isLoading ? "—" : count.toLocaleString("en-GB");
  const helperText = isLoading ? "Fetching live stats…" : helper;

  return (
    <article
      ref={ref}
      className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/95 p-8 text-center shadow-card transition-all duration-300 ease-out hover:-translate-y-2 hover:border-primary/30 hover:shadow-glow md:p-10"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, hsl(var(--primary) / 0.12) 0%, hsl(var(--secondary) / 0.06) 55%, transparent 100%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-5">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl text-inverse shadow-glow transition-transform duration-300 ease-out group-hover:rotate-3 group-hover:scale-110",
            tileGradient,
          )}
        >
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-3">
          <div className="min-h-[64px]">
            {isLoading ? (
              <span className="mx-auto block h-12 w-32 rounded-full bg-muted/50 animate-pulse" />
            ) : (
              <span
                className={cn(
                  "block bg-gradient-to-r bg-clip-text text-5xl font-black leading-none text-transparent md:text-6xl",
                  accentGradient,
                )}
              >
                {display}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground">{label}</p>
          <p className="text-sm text-muted-foreground">{helperText}</p>
        </div>
      </div>
    </article>
  );
};

const StatsShowcase = ({ stats, isLoading, dataError }: StatsShowcaseProps) => {
  const cards: Array<{
    label: string;
    value: number;
    helper: string;
    accentGradient: string;
    tileGradient: string;
    icon: LucideIcon;
  }> = [
    {
      label: "Recorded catches",
      value: stats.totalCatches,
      helper:
        stats.totalCatches > 0
          ? "Shared publicly across the UK community."
          : "Log your first catch to kick-start the leaderboard.",
      accentGradient: "from-primary via-secondary to-accent",
      tileGradient: "bg-gradient-to-br from-primary via-secondary to-accent",
      icon: Fish,
    },
    {
      label: "Active anglers",
      value: stats.activeAnglers,
      helper:
        stats.activeAnglers > 0
          ? "Anglers trading tips, scores, and sessions."
          : "Invite your crew and start scoring each other.",
      accentGradient: "from-secondary via-accent to-primary",
      tileGradient: "bg-gradient-to-br from-secondary via-accent to-primary",
      icon: Compass,
    },
    {
      label: "UK waterways",
      value: stats.waterways,
      helper:
        stats.waterways > 0
          ? "Waterways logged across the community."
          : "Add venues to build the national map.",
      accentGradient: "from-accent via-primary to-secondary",
      tileGradient: "bg-gradient-to-br from-accent via-primary to-secondary",
      icon: Waves,
    },
  ];

  return (
    <div className="space-y-12 md:space-y-16">
      <div className="space-y-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent px-5 py-2 text-xs font-extrabold uppercase tracking-[0.36em] text-inverse shadow-glow">
          <PulsingDot />
          Live Community Pulse
        </span>
        <h2 className="text-4xl font-black text-foreground md:text-5xl">
          Fueled by anglers across the UK
        </h2>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          These numbers refresh as the community logs more catches, recruits new crews, and charts new waters.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => (
          <div
            key={card.label}
            className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:duration-500"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <StatsCard {...card} isLoading={isLoading} />
          </div>
        ))}
      </div>

      {dataError && !isLoading ? (
        <p className="text-center text-sm text-destructive" role="status">
          {dataError}
        </p>
      ) : null}
    </div>
  );
};

const HomeLayout = ({ children }: { children: ReactNode }) => (
  <div className="section-container lg:max-w-7xl">
    {children}
  </div>
);

interface HeroLeftProps {
  heading: ReactNode;
  subheading: ReactNode;
  onPrimary: () => void;
  onSecondary: () => void;
  primaryLabel: string;
  secondaryLabel: string;
}

const HeroLeft = ({
  heading,
  subheading,
  onPrimary,
  onSecondary,
  primaryLabel,
  secondaryLabel,
}: HeroLeftProps) => (
  <div className="flex w-full flex-col gap-10 text-left motion-safe:animate-in motion-safe:fade-in-50 motion-safe:duration-500">
    <div className="space-y-6">
      <Heading
        as="h1"
        size="xl"
        className="text-balance text-4xl font-black leading-[1.12] tracking-[-0.045em] text-foreground md:text-6xl md:leading-[1.12] lg:text-7xl lg:leading-[1.08]"
      >
        {heading}
      </Heading>
      <Text className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl motion-safe:animate-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-500 motion-safe:delay-100">
        {subheading}
      </Text>
    </div>
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap motion-safe:animate-in motion-safe:slide-in-from-bottom-6 motion-safe:duration-500 motion-safe:delay-150">
      <Button
        variant="ocean"
        size="lg"
        className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent px-8 py-[1.15rem] text-base font-bold uppercase tracking-wider text-inverse shadow-ocean transition-all duration-300 ease-out before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-inverse/0 before:via-inverse/40 before:to-inverse/0 before:opacity-0 before:transition before:duration-500 hover:scale-[1.02] hover:shadow-glow hover:before:translate-x-full hover:before:opacity-100 focus-visible:ring-offset-0 sm:w-auto md:text-lg"
        onClick={onPrimary}
      >
        {primaryLabel}
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="w-full rounded-2xl border-border bg-card/90 text-base font-semibold text-foreground shadow-card transition-all duration-300 hover:border-primary/30 hover:bg-card/70 hover:text-primary hover:shadow-card-hover focus-visible:ring-ring sm:w-auto"
        onClick={onSecondary}
      >
        {secondaryLabel}
      </Button>
    </div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCatches: 0,
    activeAnglers: 0,
    waterways: 0,
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadHomepageData = async () => {
      setIsLoadingData(true);
      setDataError(null);

      try {
        const { data, error } = await supabase.rpc("get_community_stats");

        if (error) throw error;
        if (!isMounted) return;

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
          throw new Error("Community stats unavailable");
        }

        const toNumber = (value: unknown) => {
          if (value === null || value === undefined) return 0;
          if (typeof value === "number") return value;
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : 0;
        };

        setStats({
          totalCatches: toNumber(row.total_catches),
          activeAnglers: toNumber(row.active_anglers),
          waterways: toNumber(row.waterways),
        });
      } catch (error) {
        console.error("Failed to load homepage data", error);
        if (isMounted) {
          setDataError(
            "We couldn't load the latest stats. Please try again shortly."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };

    void loadHomepageData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const loadAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const adminStatus = await isAdminUser(user.id);
        setIsAdmin(adminStatus);
      } catch {
        setIsAdmin(false);
      }
    };

    void loadAdmin();
  }, [user]);

  const isSignedIn = Boolean(user);
  const primaryCtaLabel = isSignedIn ? "Open Live Feed" : "Create Your Logbook";
  const secondaryCtaLabel = isSignedIn
    ? isAdmin
      ? "Browse Public Highlights"
      : "Share a Fresh Catch"
    : "Browse Public Highlights";

  const handlePrimaryCta = () => {
    if (isSignedIn) {
      navigate("/feed");
    } else {
      navigate("/auth");
    }
  };

  const handleSecondaryCta = () => {
    if (!isSignedIn || isAdmin) {
      navigate("/feed");
      return;
    }
    navigate("/add-catch");
  };

  const heroHeading = (
  <>
    Turn every catch into a{" "}
    <span className="relative inline-block bg-gradient-to-br from-primary via-secondary to-accent bg-clip-text pb-1 font-black text-transparent drop-shadow-[0_8px_20px_hsl(var(--primary)/0.35)]">
      story worth scoring
    </span>
  </>
);

  const heroSubheading = (
    <>
      ReelyRated is your digital fishing partner. Log catches with precision,
      unlock community insights, and build a shareable career on and off the
      water.
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageContainer className="w-full max-w-none px-0">
        <main className="relative isolate pt-20 md:pt-24 lg:pt-28">
        <div className="absolute inset-x-0 -top-40 -z-10 flex justify-center blur-3xl">
          <div className="h-64 w-2/3 rounded-full bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/30 opacity-60" />
        </div>

        <Section className="pb-6 md:pb-8 space-y-0">
          <HomeLayout>
            <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <HeroLeft
                  heading={heroHeading}
                  subheading={heroSubheading}
                  onPrimary={handlePrimaryCta}
                  onSecondary={handleSecondaryCta}
                  primaryLabel={primaryCtaLabel}
                  secondaryLabel={secondaryCtaLabel}
                />
              </div>
              <div className="flex w-full flex-col gap-4 md:pl-6">
                <HeroLeaderboardSpotlight />
              </div>
            </div>
          </HomeLayout>
        </Section>

        <div className="mt-10 flex flex-col gap-10 md:mt-12">
          <Section className="section bg-gradient-to-br from-background via-muted/40 to-card border-y border-border/50 py-12 md:py-16 space-y-0">
            <HomeLayout>
              <StatsShowcase stats={stats} isLoading={isLoadingData} dataError={dataError} />
            </HomeLayout>
          </Section>

          <Section className="section bg-card py-12 md:py-16 space-y-0">
            <LeaderboardSection limit={6} />
          </Section>

          <Section className="section bg-muted/40 py-12 md:py-16 space-y-0">
            <HomeLayout>
              <FeatureHighlights isAdmin={isAdmin} />
            </HomeLayout>
          </Section>

          <Section className="section bg-gradient-to-br from-background via-muted/30 to-card/80 py-10 md:py-14 space-y-0">
            <HomeLayout>
              <div className="mx-auto max-w-4xl space-y-4 text-center">
                <Heading as="h2" size="xl" className="text-foreground">
                  From first bite to bragging rights in three clean steps
                </Heading>
                <Text className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                  Log your catch on the bank, let the community rate it, and use the data to plan your next session.
                </Text>
              </div>
              <div className="mt-8">
                <div className="relative mx-auto max-w-3xl">
                  <div className="flex flex-col gap-3 md:gap-4">
                    {workflowSteps.map((step, index) => {
                      const accent = stepAccents[index] ?? stepAccents[0];

                      return (
                        <div
                          key={step.title}
                          className="group relative z-10 overflow-hidden rounded-3xl border border-border/60 bg-card/95 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-4 motion-safe:duration-500 md:p-6"
                          style={{ animationDelay: `${index * 80}ms` }}
                        >
                          <div className="relative flex items-start gap-4 md:gap-5">
                            <div
                              className={cn(
                                "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-inverse shadow-glow transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 md:h-14 md:w-14",
                                accent.iconBg,
                              )}
                            >
                              <step.icon className="h-6 w-6 md:h-7 md:w-7" />
                            </div>
                            <div className="flex flex-col gap-2 text-left">
                              <div className="inline-flex items-center gap-2">
                                <Eyebrow className="rounded-full bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Step {index + 1}
                                </Eyebrow>
                              </div>
                              <Heading as="h3" size="md" className="text-foreground md:text-2xl">
                                {step.title}
                              </Heading>
                              <Text className="text-sm text-muted-foreground">{step.description}</Text>
                              {step.supporting ? (
                                <Text className="text-xs font-medium uppercase tracking-wide text-primary/80">
                                  {step.supporting}
                                </Text>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </HomeLayout>
          </Section>

          {!user && (
            <Section className="section space-y-0">
              <HomeLayout>
                <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary to-secondary px-6 py-12 text-primary-foreground shadow-glow md:px-8 md:py-16">
                  <div className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-inverse/10 blur-2xl" />
                  <div className="relative mx-auto max-w-3xl space-y-6 text-center">
                    <Heading as="h2" size="lg">
                      Join the UK's most dedicated fishing leaderboard
                    </Heading>
                    <Text className="text-lg leading-relaxed">
                      Secure your handle, build your story, and rally your crew. Your next personal
                      best deserves more than a camera roll.
                    </Text>
                    <div className="flex flex-wrap justify-center gap-4">
                      <Button
                        variant="outline"
                        size="lg"
                        className="border-inverse bg-inverse text-primary hover:bg-inverse/90"
                        onClick={() => navigate("/auth")}
                      >
                        Claim Your Profile
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        className="text-primary-foreground/80"
                        onClick={() => navigate("/feed")}
                      >
                        View Public Leaderboard
                      </Button>
                    </div>
                  </div>
                </div>
              </HomeLayout>
            </Section>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card/80 py-8 text-center text-muted-foreground">
        <HomeLayout>
          <p className="text-sm">ReelyRated • Built for UK Anglers</p>
        </HomeLayout>
      </footer>
      </PageContainer>
    </div>
  );
};

export default Index;
