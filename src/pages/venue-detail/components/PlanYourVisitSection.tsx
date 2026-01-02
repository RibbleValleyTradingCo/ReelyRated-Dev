import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { externalLinkProps, sanitizeExternalUrl } from "@/lib/urls";
import { cn } from "@/lib/utils";
import type {
  VenueOpeningHour,
  VenuePricingTier,
  VenueSpeciesStock,
} from "@/pages/venue-detail/types";
import { useState } from "react";
import {
  Activity,
  Anchor,
  Camera,
  Car,
  ChevronRight,
  Coffee,
  FileText,
  Fish,
  ParkingCircle,
  Phone,
  ShieldCheck,
  ShowerHead,
  Store,
  Tent,
  Ticket,
  Toilet,
  Users,
  Utensils,
  Wrench,
  Waves,
  type LucideIcon,
} from "lucide-react";

type PlanYourVisitSectionProps = {
  hasPlanContent: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  pricingLines: string[];
  ticketType: string;
  contactPhone: string;
  facilitiesList: string[];
  openingHours: VenueOpeningHour[];
  pricingTiers: VenuePricingTier[];
  speciesStock: VenueSpeciesStock[];
  rulesText: string | null;
  bookingEnabled: boolean;
  isOperationalLoading: boolean;
  bookingUrl: string;
  websiteUrl: string;
  mapsUrl: string;
  venueName?: string;
  recentWindow: number | null;
  displayPriceFrom: string;
  activeAnglers: number;
  paymentMethods: string[];
  paymentNotes: string;
};

const PlanYourVisitSection = ({
  hasPlanContent,
  isOwner,
  isAdmin,
  pricingLines,
  ticketType,
  contactPhone,
  facilitiesList,
  openingHours,
  pricingTiers,
  speciesStock,
  rulesText,
  bookingEnabled,
  isOperationalLoading,
  bookingUrl,
  websiteUrl,
  mapsUrl,
  venueName,
  recentWindow,
  displayPriceFrom,
  activeAnglers,
  paymentMethods,
  paymentNotes,
}: PlanYourVisitSectionProps) => {
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [primaryPrice, ...restPrices] = pricingLines;
  const secondaryPrices = restPrices.filter((line) => line !== ticketType);
  const safeBookingUrl = sanitizeExternalUrl(bookingUrl);
  const safeWebsiteUrl = sanitizeExternalUrl(websiteUrl);
  const safeMapsUrl = sanitizeExternalUrl(mapsUrl);
  const hasRecentWindow = typeof recentWindow === "number" && recentWindow > 0;
  const sortedPricingTiers = [...pricingTiers].sort(
    (a, b) => a.order_index - b.order_index
  );
  const hasPricingTiers = sortedPricingTiers.length > 0;
  const hasRulesText = Boolean(rulesText?.trim());
  const rulesList = hasRulesText
    ? (rulesText ?? "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^(\d+\.|[-*•])\s+/, ""))
    : [];
  const hasRuleItems = rulesList.length > 0;
  const hasMoreRules = rulesList.length > 3;
  const visibleRules = rulesExpanded ? rulesList : rulesList.slice(0, 3);
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const daySortIndex = new Map(
    dayOrder.map((value, index) => [value, index])
  );
  const openingGroups = (() => {
    const map = new Map<string, VenueOpeningHour[]>();
    openingHours.forEach((hour) => {
      const label = hour.label?.trim() || "Opening hours";
      const bucket = map.get(label);
      if (bucket) {
        bucket.push(hour);
      } else {
        map.set(label, [hour]);
      }
    });
    return Array.from(map.entries()).map(([label, rows]) => ({
      label,
      rows: [...rows].sort(
        (a, b) =>
          (daySortIndex.get(a.day_of_week) ?? 0) -
          (daySortIndex.get(b.day_of_week) ?? 0)
      ),
    }));
  })();
  const formatTime = (value: string | null) =>
    value ? value.slice(0, 5) : "";
  const hasPricingContent =
    hasPricingTiers ||
    Boolean(primaryPrice) ||
    Boolean(ticketType) ||
    secondaryPrices.length > 0;
  const pricingAnchorId = "plan-prices";
  const hasSpeciesStock = speciesStock.length > 0;
  const formatWeight = (value: number | null, unit: string | null) =>
    value === null || value === undefined ? null : `${value}${unit ?? ""}`;
  const densityBadge = (value: string | null) => {
    if (!value) return null;
    const normalized = value.toLowerCase();
    const styles =
      normalized === "high"
        ? "bg-secondary/15 text-secondary"
        : normalized === "medium"
        ? "bg-primary/10 text-primary"
        : "bg-muted/70 text-muted-foreground";
    const label =
      normalized === "high"
        ? "High stock"
        : normalized === "medium"
        ? "Medium stock"
        : "Low stock";
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles}`}
      >
        {label}
      </span>
    );
  };
  const resolveFacilityIcon = (facility: string): LucideIcon => {
    const value = facility.toLowerCase();
    if (value.includes("wifi") || value.includes("wi-fi")) return Activity;
    if (value.includes("toilet") || value.includes("loo")) return Toilet;
    if (value.includes("shower")) return ShowerHead;
    if (value.includes("cafe") || value.includes("coffee")) return Coffee;
    if (value.includes("bait")) return Fish;
    if (value.includes("shop") || value.includes("tackle")) return Store;
    if (value.includes("parking")) return ParkingCircle;
    if (value.includes("barrow")) return Car;
    if (value.includes("charging")) return Activity;
    if (value.includes("water")) return Waves;
    if (value.includes("accommodation") || value.includes("lodging")) return Tent;
    if (value.includes("nets") || value.includes("mats")) return Fish;
    if (value.includes("defib") || value.includes("first aid")) return ShieldCheck;
    if (value.includes("cctv") || value.includes("camera")) return Camera;
    if (value.includes("disabled") || value.includes("access")) return Users;
    if (value.includes("family")) return Users;
    if (value.includes("camp")) return Tent;
    if (value.includes("food") || value.includes("restaurant")) return Utensils;
    if (value.includes("boat") || value.includes("launch")) return Anchor;
    if (value.includes("car")) return Car;
    return Wrench;
  };

  const sectionSubtitle = "Everything you need to plan your session.";

  const iconClass = "h-4 w-4 text-muted-foreground";
  const linkRowClass =
    "focus-ring flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-semibold text-foreground transition hover:border-border/80 hover:bg-muted/40";

  const SkeletonLine = ({ className }: { className?: string }) => (
    <div className={cn("h-3 w-full rounded-full bg-muted animate-pulse", className)} />
  );
  const paymentMethodsLabel = paymentMethods
    .map((method) => method.replace(/_/g, " "))
    .map((method) => method.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(", ");
  const hasPaymentMethods = paymentMethodsLabel.length > 0;
  const hasPaymentNotes = Boolean(paymentNotes?.trim());

  const pricingDetails = isOperationalLoading && !hasPricingContent ? (
    <div className="space-y-2">
      <SkeletonLine className="w-24" />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-2/3" />
    </div>
  ) : hasPricingContent ? (
    hasPricingTiers ? (
      <div className="space-y-2 text-sm text-muted-foreground">
        {sortedPricingTiers.map((tier) => (
          <div
            key={tier.id}
            className="flex flex-wrap items-baseline justify-between gap-3"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-foreground">{tier.label}</span>
              {tier.audience ? (
                <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {tier.audience}
                </span>
              ) : null}
              {tier.unit ? (
                <span className="text-xs text-muted-foreground">({tier.unit})</span>
              ) : null}
            </div>
            <span className="font-semibold text-foreground">{tier.price}</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="space-y-2">
        {primaryPrice ? (
          <p className="text-4xl font-semibold text-foreground">{primaryPrice}</p>
        ) : null}
        {ticketType ? (
          <p className="text-sm font-semibold text-muted-foreground">{ticketType}</p>
        ) : null}
        {secondaryPrices.length > 0 ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            {secondaryPrices.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>
    )
  ) : (
    <div className="space-y-1 text-sm text-muted-foreground">
      <p>Details coming soon.</p>
      {(isOwner || isAdmin) && (
        <p className="text-xs text-muted-foreground/70">Add these details in Manage venue.</p>
      )}
    </div>
  );


  const openingHoursContent = isOperationalLoading && openingHours.length === 0 ? (
    <div className="space-y-2">
      <SkeletonLine className="w-32" />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-2/3" />
    </div>
  ) : openingGroups.length > 0 ? (
    <div className="space-y-4">
      {openingGroups.map((group) => (
        <div key={group.label} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.rows.map((row) => {
              const label = dayLabels[row.day_of_week] ?? "Day";
              const opensAt = formatTime(row.opens_at);
              const closesAt = formatTime(row.closes_at);
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between text-sm text-muted-foreground"
                >
                  <span className="font-medium text-muted-foreground">{label}</span>
                  {row.is_closed ? (
                    <span className="text-muted-foreground">Closed</span>
                  ) : opensAt && closesAt ? (
                    <span className="font-semibold text-foreground">
                      {opensAt}–{closesAt}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60">-</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">No opening hours posted yet.</p>
  );

  const stockContent =
    isOperationalLoading && !hasSpeciesStock ? (
      <div className="space-y-2">
        <SkeletonLine className="w-32" />
        <SkeletonLine className="w-5/6" />
        <SkeletonLine className="w-2/3" />
      </div>
    ) : hasSpeciesStock ? (
      <div className="space-y-3">
        {speciesStock.map((row) => {
          const record = formatWeight(row.record_weight, row.record_unit);
          const average = formatWeight(row.avg_weight, row.record_unit);
          const rangeMin = formatWeight(row.size_range_min, row.record_unit);
          const rangeMax = formatWeight(row.size_range_max, row.record_unit);
          const range =
            rangeMin || rangeMax
              ? `${rangeMin ?? "—"} - ${rangeMax ?? "—"}`
              : null;
          return (
            <div
              key={row.id}
              className="space-y-2 rounded-xl border border-border/70 bg-muted/50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {row.species_name}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {record ? <span>Record: {record}</span> : null}
                    {average ? <span>Average: {average}</span> : null}
                    {range ? <span>Size range: {range}</span> : null}
                  </div>
                </div>
                {densityBadge(row.stock_density)}
              </div>
              {row.stock_notes ? (
                <p className="text-xs text-muted-foreground">{row.stock_notes}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">No stock information posted yet.</p>
    );

  const facilitiesContent = facilitiesList.length > 0 ? (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {facilitiesList.map((facility) => {
        const FacilityIcon = resolveFacilityIcon(facility);
        return (
          <div
            key={facility}
            className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground"
          >
            <FacilityIcon className="h-4 w-4 text-primary" strokeWidth={2.25} />
            <span className="truncate">{facility}</span>
          </div>
        );
      })}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">No facilities posted yet.</p>
  );

  const rulesContent = isOperationalLoading && !hasRuleItems ? (
    <div className="space-y-2">
      <SkeletonLine />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-2/3" />
    </div>
  ) : hasRuleItems ? (
    <div className="space-y-3">
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        {visibleRules.map((rule, index) => {
          const [prefix, ...rest] = rule.split(":");
          const normalizedPrefix = prefix?.trim().toLowerCase() ?? "";
          const canHighlight =
            rest.length > 0 &&
            ["bait", "bait bans", "tackle", "conduct", "behavior", "behaviour"].includes(
              normalizedPrefix
            );
          const suffix = rest.join(":").trim();
          return (
            <li key={`${rule}-${index}`} className="leading-6">
              {canHighlight ? (
                <>
                  <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {prefix.trim()}
                  </span>
                  <span>{suffix}</span>
                </>
              ) : (
                rule
              )}
            </li>
          );
        })}
      </ul>
      {hasMoreRules ? (
        <button
          type="button"
          onClick={() => setRulesExpanded((prev) => !prev)}
          className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {rulesExpanded ? "Show fewer rules" : "View all rules & terms"}
        </button>
      ) : null}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">No rules posted yet.</p>
  );

  const primaryWebsiteUrl = safeWebsiteUrl || safeBookingUrl;
  const primaryWebsiteLink = externalLinkProps(primaryWebsiteUrl);
  const mapsLink = externalLinkProps(safeMapsUrl);
  const bookingLink = externalLinkProps(safeBookingUrl);
  const bookingMethodCopy = contactPhone
    ? "Pre-booking is essential via phone."
    : primaryWebsiteUrl
    ? "Book online via the venue website."
    : "Booking details coming soon.";
  const websiteButtonLabel = safeWebsiteUrl ? "Visit venue website" : "Booking page";
  const canShowWebsiteButton = Boolean(primaryWebsiteLink);
  const disableWebsiteButton =
    !bookingEnabled && Boolean(safeBookingUrl) && !safeWebsiteUrl;

  const pricingInfoContent = (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tickets
        </p>
        {pricingDetails}
      </div>
      {hasPaymentMethods || hasPaymentNotes ? (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Payment
          </p>
          {hasPaymentMethods ? (
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Payment accepted:</span>{" "}
              {paymentMethodsLabel}
            </div>
          ) : null}
          {hasPaymentNotes ? (
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary lg:hidden">
              {paymentNotes}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const howToBookContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Booking method</p>
        <p className="text-sm text-muted-foreground">{bookingMethodCopy}</p>
      </div>
      <div className="space-y-2">
        {contactPhone ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Call venue:</span>{" "}
            <a
              href={`tel:${contactPhone}`}
              className="font-semibold text-primary underline underline-offset-4 hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {contactPhone}
            </a>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Phone booking details coming soon.</p>
        )}
        {canShowWebsiteButton && primaryWebsiteLink ? (
          <a
            {...primaryWebsiteLink}
            className={cn(
              "inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              disableWebsiteButton && "pointer-events-none opacity-60"
            )}
          >
            {websiteButtonLabel}
            <ChevronRight className="h-4 w-4" />
          </a>
        ) : null}
        {!bookingEnabled && safeBookingUrl ? (
          <p className="text-xs font-semibold text-muted-foreground">Bookings currently closed.</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Opening times
        </p>
        {openingHoursContent}
      </div>
      {!contactPhone && !primaryWebsiteLink && (isOwner || isAdmin) ? (
        <p className="text-xs text-muted-foreground/70">Add booking details in Manage venue.</p>
      ) : null}
    </div>
  );

  const openingSummary = (() => {
    const today = new Date().getDay();
    const todayRows = openingHours.filter((row) => row.day_of_week === today);
    if (todayRows.length === 0) return "Open Today: Not provided";
    if (todayRows.every((row) => row.is_closed)) return "Open Today: Closed";
    const times = todayRows
      .filter((row) => !row.is_closed)
      .map((row) => {
        const opensAt = formatTime(row.opens_at);
        const closesAt = formatTime(row.closes_at);
        if (opensAt && closesAt) return `${opensAt}–${closesAt}`;
        if (opensAt || closesAt) return `${opensAt || ""}${opensAt && closesAt ? "–" : ""}${closesAt || ""}`;
        return "";
      })
      .filter(Boolean);
    if (times.length === 0) return "Open Today: Not provided";
    return `Open Today: ${Array.from(new Set(times)).join(", ")}`;
  })();

  const hasQuickLinks = Boolean(safeMapsUrl || safeBookingUrl || safeWebsiteUrl);

  const sidebarHowToBook = (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Phone className="h-4 w-4 text-primary" />
        How to book
      </div>
      <div className="space-y-2">
        {contactPhone ? (
          <Button
            asChild
            className="h-11 w-full rounded-lg shadow-card"
          >
            <a href={`tel:${contactPhone}`}>Call venue</a>
          </Button>
        ) : (
          <Button disabled className="h-11 w-full rounded-lg">
            Call venue
          </Button>
        )}
        {canShowWebsiteButton && primaryWebsiteLink ? (
          <Button
            asChild
            disabled={disableWebsiteButton}
            className={cn(
              "h-11 w-full rounded-lg border border-border bg-background text-foreground shadow-card hover:bg-muted/40",
              disableWebsiteButton && "pointer-events-none opacity-60"
            )}
          >
            <a {...primaryWebsiteLink}>
              {websiteButtonLabel}
            </a>
          </Button>
        ) : null}
        {!bookingEnabled && safeBookingUrl ? (
          <p className="text-xs font-semibold text-muted-foreground">Bookings currently closed.</p>
        ) : null}
      </div>
      {hasQuickLinks ? (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Quick links
          </p>
          {mapsLink ? (
            <a {...mapsLink} className={linkRowClass}>
              <span>Get directions</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
            </a>
          ) : null}
          {bookingLink ? (
            <a {...bookingLink} className={linkRowClass}>
              <span>Booking page</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
            </a>
          ) : null}
        </div>
      ) : null}
      <div className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Opening times</p>
        <p>{openingSummary}</p>
      </div>
    </div>
  );

  const sidebarPaymentNote =
    hasPaymentNotes ? (
      <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs font-semibold text-primary shadow-card">
        Payment note
        <div className="mt-2 text-sm font-normal text-primary">
          {paymentNotes}
        </div>
      </div>
    ) : null;

  const accordionItems = [
    {
      value: "stock",
      title: "Stock & Species",
      icon: Fish,
      content: stockContent,
    },
    {
      value: "facilities",
      title: "Facilities & Comfort",
      icon: Wrench,
      content: facilitiesContent,
    },
    {
      value: "pricing",
      title: "Prices & Ticket Info",
      icon: Ticket,
      content: pricingInfoContent,
      anchorId: pricingAnchorId,
    },
    {
      value: "booking",
      title: "How to Book / Contact",
      icon: Phone,
      content: howToBookContent,
      mobileOnly: true,
    },
    {
      value: "rules",
      title: "Venue Rules",
      icon: FileText,
      content: rulesContent,
    },
  ];

  const bookingBanner = (() => {
    const hasBookingUrl = Boolean(safeBookingUrl);
    const bannerPrimaryLabel = hasBookingUrl
      ? "Book your session"
      : "Visit website";
    const bannerPrimaryUrl =
      hasBookingUrl && !bookingEnabled
        ? null
        : safeBookingUrl || safeWebsiteUrl;
    const bannerSecondaryLabel = safeWebsiteUrl
      ? "Check availability"
      : "Get directions";
    const bannerSecondaryUrl = safeWebsiteUrl || safeMapsUrl;
    const bannerPrimaryLink = externalLinkProps(bannerPrimaryUrl);
    const bannerSecondaryLink = externalLinkProps(bannerSecondaryUrl);
    const bannerSubtextParts = [
      activeAnglers > 0
        ? `See ${activeAnglers} angler${
            activeAnglers === 1 ? "" : "s"
          } who have logged catches here.`
        : "",
    ].filter(Boolean);
    const bannerSubtext = bannerSubtextParts.length
      ? bannerSubtextParts.join(" ")
      : "Book your next session directly with the venue.";
    const bannerPriceLine = displayPriceFrom
      ? displayPriceFrom.toLowerCase().startsWith("from")
        ? displayPriceFrom
        : `From ${displayPriceFrom}`
      : "";

    return (
      <div className="rounded-3xl bg-gradient-to-br from-primary to-secondary px-6 py-10 text-primary-foreground shadow-ocean md:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {hasRecentWindow ? (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
              High demand last 30 days
            </div>
          ) : null}
          <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to land your next PB?
          </h2>
          <p className="mt-3 text-base text-primary-foreground/80 md:text-lg">
            {bannerSubtext}
          </p>
          {bannerPriceLine || hasPricingContent ? (
            <p className="mt-2 text-sm text-primary-foreground/80">
              {bannerPriceLine ? `${bannerPriceLine}. ` : ""}
              {hasPricingContent ? (
                <a
                  href={`#${pricingAnchorId}`}
                  className="font-semibold text-primary-foreground underline underline-offset-4 hover:text-primary-foreground/80"
                >
                  See prices
                </a>
              ) : null}
            </p>
          ) : null}
          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            {bannerPrimaryLink ? (
              <Button
                asChild
                className="h-12 w-full rounded-xl bg-inverse text-inverse-foreground shadow-card transition hover:bg-inverse/90 sm:w-auto dark:bg-inverse-foreground dark:text-inverse"
              >
                <a {...bannerPrimaryLink}>
                  {bannerPrimaryLabel}
                </a>
              </Button>
            ) : (
              <Button
                disabled
                className="h-12 w-full rounded-xl bg-inverse text-inverse-foreground shadow-card sm:w-auto dark:bg-inverse-foreground dark:text-inverse"
              >
                {bannerPrimaryLabel}
              </Button>
            )}
            {bannerSecondaryLink ? (
              <Button
                asChild
                className="h-12 w-full rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground shadow-card hover:bg-primary-foreground/20 sm:w-auto"
              >
                <a {...bannerSecondaryLink}>
                  {bannerSecondaryLabel}
                </a>
              </Button>
            ) : (
              <Button
                disabled
                className="h-12 w-full rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground shadow-card sm:w-auto"
              >
                {bannerSecondaryLabel}
              </Button>
            )}
          </div>
          {!bookingEnabled && hasBookingUrl ? (
            <p className="mt-3 text-xs text-primary-foreground/80">
              Bookings currently closed.
            </p>
          ) : null}
          <p className="mt-4 text-xs text-primary-foreground/80">
            {ticketType || "Day tickets available"}
            {hasRecentWindow
              ? ` • ${recentWindow} catches in the last 30 days`
              : ""}
          </p>
        </div>
      </div>
    );
  })();

  return hasPlanContent || isOwner || isAdmin || isOperationalLoading ? (
    <Section className="space-y-10 py-14 md:py-16">
      <SectionHeader
        title="Plan Your Visit"
        subtitle={sectionSubtitle}
        titleClassName="text-3xl font-bold text-foreground md:text-4xl"
        className="px-0 mb-6"
        emphasizeOnMobile
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <Accordion type="multiple" defaultValue={["stock"]} className="space-y-4">
            {accordionItems.map((item) => (
              <AccordionItem
                key={item.value}
                value={item.value}
                id={item.anchorId}
                className={cn(
                  "rounded-2xl border border-b-0 border-border bg-card shadow-card",
                  item.mobileOnly && "lg:hidden"
                )}
              >
                <AccordionTrigger className="flex w-full min-h-[44px] items-center justify-between px-4 py-3 text-left text-sm font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <span className="flex items-center gap-2">
                    <item.icon className={iconClass} strokeWidth={2.25} />
                    {item.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <aside className="mt-8 hidden lg:mt-0 lg:block">
          <div className="space-y-4 lg:sticky lg:top-24">
            {sidebarHowToBook}
            {sidebarPaymentNote}
          </div>
        </aside>
      </div>

      <div className="pt-2 md:pt-4">{bookingBanner}</div>

      {!hasPlanContent && (isOwner || isAdmin) ? (
        <p className="text-base text-muted-foreground">
          Owners can add contact, booking, and facilities details from Edit / Manage venue.
        </p>
      ) : null}
    </Section>
  ) : null;
};

export default PlanYourVisitSection;
