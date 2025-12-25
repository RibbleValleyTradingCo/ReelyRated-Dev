import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { normalizeExternalUrl } from "@/lib/urls";
import { cn } from "@/lib/utils";
import type {
  VenueOpeningHour,
  VenuePricingTier,
} from "@/pages/venue-detail/types";
import { Suspense, lazy, useState } from "react";
import {
  Anchor,
  Car,
  ChevronRight,
  Clock,
  Coffee,
  Fish,
  Globe2,
  ParkingCircle,
  Phone,
  ScrollText,
  ShowerHead,
  Store,
  Tent,
  Ticket,
  Toilet,
  Utensils,
  Wrench,
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
  bestForTags: string[];
  openingHours: VenueOpeningHour[];
  pricingTiers: VenuePricingTier[];
  rulesText: string | null;
  bookingEnabled: boolean;
  isOperationalLoading: boolean;
  bookingUrl: string;
  websiteUrl: string;
  mapsUrl: string;
  venueName?: string;
};

const LazyMarkdownContent = lazy(
  () => import("@/components/typography/MarkdownContent")
);

const PlanYourVisitSection = ({
  hasPlanContent,
  isOwner,
  isAdmin,
  pricingLines,
  ticketType,
  contactPhone,
  facilitiesList,
  bestForTags,
  openingHours,
  pricingTiers,
  rulesText,
  bookingEnabled,
  isOperationalLoading,
  bookingUrl,
  websiteUrl,
  mapsUrl,
  venueName,
}: PlanYourVisitSectionProps) => {
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [primaryPrice, ...restPrices] = pricingLines;
  const secondaryPrices = restPrices.filter((line) => line !== ticketType);
  const safeBookingUrl = normalizeExternalUrl(bookingUrl);
  const safeWebsiteUrl = normalizeExternalUrl(websiteUrl);
  const safeMapsUrl = normalizeExternalUrl(mapsUrl);
  const formattedBestForTags = bestForTags.map((tag) =>
    tag.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
  const sortedPricingTiers = [...pricingTiers].sort(
    (a, b) => a.order_index - b.order_index
  );
  const hasPricingTiers = sortedPricingTiers.length > 0;
  const hasRulesText = Boolean(rulesText?.trim());
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
  const resolveFacilityIcon = (facility: string): LucideIcon => {
    const value = facility.toLowerCase();
    if (value.includes("toilet") || value.includes("loo")) return Toilet;
    if (value.includes("shower")) return ShowerHead;
    if (value.includes("cafe") || value.includes("coffee")) return Coffee;
    if (value.includes("bait")) return Fish;
    if (value.includes("shop") || value.includes("tackle")) return Store;
    if (value.includes("parking")) return ParkingCircle;
    if (value.includes("camp")) return Tent;
    if (value.includes("food") || value.includes("restaurant")) return Utensils;
    if (value.includes("boat") || value.includes("launch")) return Anchor;
    if (value.includes("car")) return Car;
    return Wrench;
  };

  const venueLabel = venueName?.trim() ? venueName : "this venue";
  const sectionSubtitle = `Everything you need to prepare for your trip to ${venueLabel}.`;

  const iconClass = "h-4 w-4 text-slate-500";
  const linkRowClass =
    "flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2";

  const SkeletonLine = ({ className }: { className?: string }) => (
    <div className={cn("h-3 w-full rounded-full bg-slate-100 animate-pulse", className)} />
  );
  const MarkdownFallback = (
    <div className="space-y-2">
      <SkeletonLine />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-2/3" />
    </div>
  );

  const pricingDetails = isOperationalLoading && !hasPricingContent ? (
    <div className="space-y-2">
      <SkeletonLine className="w-24" />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-2/3" />
    </div>
  ) : hasPricingContent ? (
    hasPricingTiers ? (
      <div className="space-y-2 text-sm text-slate-700">
        {sortedPricingTiers.map((tier) => (
          <div key={tier.id} className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-slate-900">{tier.label}</span>
              {tier.unit ? (
                <span className="text-xs text-slate-500">({tier.unit})</span>
              ) : null}
            </div>
            <span className="font-semibold text-slate-900">{tier.price}</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="space-y-2">
        {primaryPrice ? (
          <p className="text-4xl font-semibold text-slate-900">{primaryPrice}</p>
        ) : null}
        {ticketType ? (
          <p className="text-sm font-semibold text-slate-600">{ticketType}</p>
        ) : null}
        {secondaryPrices.length > 0 ? (
          <div className="space-y-1 text-sm text-slate-600">
            {secondaryPrices.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}
      </div>
    )
  ) : (
    <div className="space-y-1 text-sm text-slate-500">
      <p>Details coming soon.</p>
      {(isOwner || isAdmin) && (
        <p className="text-xs text-slate-400">Add these details in Manage venue.</p>
      )}
    </div>
  );

  const pricingActions = (
    <div className="space-y-3">
      {safeBookingUrl && bookingEnabled ? (
        <Button asChild className="h-11 w-full rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700">
          <a href={safeBookingUrl} target="_blank" rel="noreferrer">
            Book now
          </a>
        </Button>
      ) : safeBookingUrl ? (
        <Button disabled className="h-11 w-full rounded-lg bg-blue-600/60 text-white">
          Book now
        </Button>
      ) : null}
      {!bookingEnabled && safeBookingUrl ? (
        <p className="text-xs font-semibold text-slate-500">Bookings currently closed.</p>
      ) : null}
      {formattedBestForTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Best for:</span>
          {formattedBestForTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );

  const contactDetails =
    contactPhone || safeWebsiteUrl ? (
      <div className="space-y-2 text-sm text-slate-600">
        {contactPhone ? (
          <>
            <a
              href={`tel:${contactPhone}`}
              className="text-base font-semibold text-slate-900 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
            >
              {contactPhone}
            </a>
            <p className="text-sm text-slate-500">Call for booking questions.</p>
          </>
        ) : null}
        {safeWebsiteUrl ? (
          <a
            href={safeWebsiteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-800"
          >
            Visit official website
          </a>
        ) : null}
      </div>
    ) : (
      <div className="space-y-1 text-sm text-slate-500">
        <p>Details coming soon.</p>
        {(isOwner || isAdmin) && (
          <p className="text-xs text-slate-400">Add these details in Manage venue.</p>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                  className="flex items-center justify-between text-sm text-slate-700"
                >
                  <span className="font-medium text-slate-600">{label}</span>
                  {row.is_closed ? (
                    <span className="text-slate-500">Closed</span>
                  ) : opensAt && closesAt ? (
                    <span className="font-semibold text-slate-700">
                      {opensAt}–{closesAt}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-slate-500">No opening hours posted yet.</p>
  );

  const facilitiesContent = facilitiesList.length > 0 ? (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {facilitiesList.map((facility) => {
        const FacilityIcon = resolveFacilityIcon(facility);
        return (
          <div
            key={facility}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <FacilityIcon className="h-4 w-4 text-blue-600" strokeWidth={2.25} />
            <span className="truncate">{facility}</span>
          </div>
        );
      })}
    </div>
  ) : (
    <p className="text-sm text-slate-500">No facilities posted yet.</p>
  );

  const rulesContent = isOperationalLoading && !hasRulesText ? (
    <div className="space-y-2">
      <SkeletonLine />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-2/3" />
    </div>
  ) : hasRulesText ? (
    <Suspense fallback={MarkdownFallback}>
      <LazyMarkdownContent content={rulesText ?? ""} className="text-sm text-slate-700" />
    </Suspense>
  ) : (
    <p className="text-sm text-slate-500">No rules posted yet.</p>
  );

  const rulesNeedsClamp = (rulesText?.trim().length ?? 0) > 280;
  const rulesContentDesktop = isOperationalLoading && !hasRulesText ? (
    <div className="space-y-2">
      <SkeletonLine />
      <SkeletonLine className="w-5/6" />
      <SkeletonLine className="w-2/3" />
    </div>
  ) : hasRulesText ? (
    <div className="space-y-3">
      <div
        className={cn(
          "text-sm text-slate-700",
          !rulesExpanded && rulesNeedsClamp && "line-clamp-6"
        )}
      >
        <Suspense fallback={MarkdownFallback}>
          <LazyMarkdownContent content={rulesText ?? ""} />
        </Suspense>
      </div>
      {rulesNeedsClamp ? (
        <button
          type="button"
          onClick={() => setRulesExpanded((prev) => !prev)}
          className="text-xs font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-800"
        >
          {rulesExpanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  ) : (
    <p className="text-sm text-slate-500">No rules posted yet.</p>
  );

  const bookingStatusBadge = !bookingEnabled ? (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
      Bookings currently closed
    </span>
  ) : null;

  const quickLinksContent = (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {safeBookingUrl ? (
          bookingEnabled ? (
            <Button asChild className="h-11 w-full rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700">
              <a href={safeBookingUrl} target="_blank" rel="noreferrer">
                Book now
              </a>
            </Button>
          ) : (
            <Button disabled className="h-11 w-full rounded-lg bg-blue-600/60 text-white">
              Book now
            </Button>
          )
        ) : null}
        {contactPhone ? (
          <Button asChild variant="outline" className="h-11 w-full rounded-lg border-slate-200 bg-white">
            <a href={`tel:${contactPhone}`}>Call venue</a>
          </Button>
        ) : (
          <Button disabled variant="outline" className="h-11 w-full rounded-lg border-slate-200 bg-white">
            Call venue
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {safeWebsiteUrl ? (
          <a href={safeWebsiteUrl} target="_blank" rel="noreferrer" className={linkRowClass}>
            <span>Visit website</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </a>
        ) : null}
        {safeMapsUrl ? (
          <a href={safeMapsUrl} target="_blank" rel="noreferrer" className={linkRowClass}>
            <span>Get directions</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </a>
        ) : (
          <span className={cn(linkRowClass, "cursor-not-allowed opacity-60")}>
            <span>Get directions</span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </span>
        )}
      </div>
      {!safeBookingUrl && !safeWebsiteUrl && (isOwner || isAdmin) ? (
        <p className="text-xs text-slate-400">Add these details in Manage venue.</p>
      ) : null}
    </div>
  );

  const accordionItems = [
    {
      value: "pricing",
      title: "Tickets & Pricing",
      icon: Ticket,
      content: (
        <div className="space-y-4">
          {pricingDetails}
          {pricingActions}
        </div>
      ),
    },
    {
      value: "contact",
      title: "Contact",
      icon: Phone,
      content: contactDetails,
    },
    {
      value: "hours",
      title: "Opening Hours",
      icon: Clock,
      content: openingHoursContent,
    },
    {
      value: "facilities",
      title: "Facilities",
      icon: Wrench,
      content: facilitiesContent,
    },
    {
      value: "rules",
      title: "Rules & Tackle",
      icon: ScrollText,
      content: rulesContent,
    },
    {
      value: "actions",
      title: "Quick Links",
      icon: Globe2,
      content: quickLinksContent,
    },
  ];

  return hasPlanContent || isOwner || isAdmin || isOperationalLoading ? (
    <Section className="space-y-6 py-14 md:py-16">
      <SectionHeader
        title="Plan Your Visit"
        subtitle={sectionSubtitle}
        titleClassName="text-3xl font-bold text-gray-900 md:text-4xl"
        className="px-0 mb-6"
        emphasizeOnMobile
      />

      <div className="hidden lg:block">
        <div className="rounded-3xl bg-slate-50/80 p-4 lg:p-5">
          <div className="grid grid-cols-2 gap-5">
            <Card className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg")}>
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <Ticket className="h-4 w-4 text-slate-500" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Tickets & Pricing</p>
                    <p className="text-xs text-slate-500">Rates and ticket types for this venue.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-4">
                {pricingDetails}
                {pricingActions}
              </CardContent>
            </Card>

            <Card className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg")}>
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <Phone className="h-4 w-4 text-slate-500" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Booking & Contact</p>
                    <p className="text-xs text-slate-500">Call or check availability before you travel.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-3">
                {bookingStatusBadge}
                {contactDetails}
              </CardContent>
            </Card>

            <Card className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg")}>
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <Globe2 className="h-4 w-4 text-slate-500" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Quick Links</p>
                    <p className="text-xs text-slate-500">Fast actions for booking and directions.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-2 space-y-3">
                <div className="grid gap-2">
                  {safeBookingUrl ? (
                    bookingEnabled ? (
                      <Button asChild className="h-11 w-full rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700">
                        <a href={safeBookingUrl} target="_blank" rel="noreferrer">
                          Book now
                        </a>
                      </Button>
                    ) : (
                      <Button disabled className="h-11 w-full rounded-lg bg-blue-600/60 text-white">
                        Book now
                      </Button>
                    )
                  ) : null}
                  {safeWebsiteUrl ? (
                    <Button asChild variant="outline" className="h-11 w-full rounded-lg border-slate-200 bg-white">
                      <a href={safeWebsiteUrl} target="_blank" rel="noreferrer">
                        Visit website
                      </a>
                    </Button>
                  ) : null}
                  {safeMapsUrl ? (
                    <Button asChild variant="outline" className="h-11 w-full rounded-lg border-slate-200 bg-white">
                      <a href={safeMapsUrl} target="_blank" rel="noreferrer">
                        Get directions
                      </a>
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="h-11 w-full rounded-lg border-slate-200 bg-white">
                      Get directions
                    </Button>
                  )}
                  {contactPhone ? (
                    <Button asChild variant="outline" className="h-11 w-full rounded-lg border-slate-200 bg-white">
                      <a href={`tel:${contactPhone}`}>Call venue</a>
                    </Button>
                  ) : null}
                </div>
                {!safeBookingUrl && !safeWebsiteUrl && (isOwner || isAdmin) ? (
                  <p className="text-xs text-slate-400">Add these details in Manage venue.</p>
                ) : null}
              </CardContent>
            </Card>

            <Card className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg")}>
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <Wrench className="h-4 w-4 text-slate-500" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Facilities</p>
                    <p className="text-xs text-slate-500">Amenities available on-site.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-2">{facilitiesContent}</CardContent>
            </Card>

            <Card className={cn("col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg")}>
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <Clock className="h-4 w-4 text-slate-500" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Opening Hours</p>
                    <p className="text-xs text-slate-500">Seasonal or day-by-day opening times.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-2">{openingHoursContent}</CardContent>
            </Card>

            <Card className={cn("col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg")}>
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <ScrollText className="h-4 w-4 text-slate-500" strokeWidth={2.25} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Rules & Tackle</p>
                    <p className="text-xs text-slate-500">Key rules anglers should know.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-2">{rulesContentDesktop}</CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <Accordion type="multiple" className="space-y-3">
          {accordionItems.map((item) => (
            <AccordionItem
              key={item.value}
              value={item.value}
              className="rounded-2xl border border-b-0 border-slate-200 bg-white shadow-sm"
            >
              <AccordionTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-900 hover:no-underline">
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

      {!hasPlanContent && (isOwner || isAdmin) ? (
        <p className="text-base text-gray-600">
          Owners can add contact, booking, and facilities details from Edit / Manage venue.
        </p>
      ) : null}
    </Section>
  ) : null;
};

export default PlanYourVisitSection;
