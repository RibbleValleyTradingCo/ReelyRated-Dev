import Section from "@/components/layout/Section";
import SectionHeader from "@/components/layout/SectionHeader";
import MarkdownContent from "@/components/typography/MarkdownContent";
import type {
  VenueOpeningHour,
  VenuePricingTier,
} from "@/pages/venue-detail/types";
import {
  Anchor,
  Car,
  ChevronRight,
  Coffee,
  Clock,
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
};

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
}: PlanYourVisitSectionProps) => {
  const [primaryPrice, ...restPrices] = pricingLines;
  const secondaryPrices = restPrices.filter((line) => line !== ticketType);
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
  const linkClassName =
    "text-sm font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2";
  const mutedIconClassName = "h-4 w-4 text-slate-500";
  const cardBase =
    "group h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-lg";
  const actionRowClassName =
    "flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2";

  return hasPlanContent || isOwner || isAdmin || isOperationalLoading ? (
    <Section className="space-y-6 py-14 md:py-16">
      <SectionHeader title="Plan Your Visit" className="px-0 mb-6" />
      <div className="grid gap-6 md:grid-cols-3 md:grid-rows-2">
        <div className={`md:col-span-2 md:row-span-2 ${cardBase} flex flex-col`}>
          <div className="flex items-center gap-2">
            <Ticket className={mutedIconClassName} strokeWidth={2.25} />
            <h3 className="text-base font-semibold text-gray-800">
              Tickets & Pricing
            </h3>
          </div>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            {hasPricingContent ? (
              hasPricingTiers ? (
                <div className="space-y-2 text-sm text-slate-700">
                  {sortedPricingTiers.map((tier) => (
                    <div key={tier.id} className="flex flex-wrap gap-1">
                      <span className="font-semibold text-slate-900">
                        {tier.label}
                      </span>
                      <span className="text-slate-500">-</span>
                      <span className="font-semibold text-slate-900">
                        {tier.price}
                      </span>
                      {tier.unit ? (
                        <span className="text-slate-500">({tier.unit})</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {primaryPrice ? (
                    <p className="text-5xl font-semibold text-slate-900">
                      {primaryPrice}
                    </p>
                  ) : null}
                  {ticketType ? (
                    <p className="text-sm font-semibold text-slate-600">
                      {ticketType}
                    </p>
                  ) : null}
                  {secondaryPrices.length > 0 ? (
                    <div className="space-y-1.5 text-sm text-slate-600">
                      {secondaryPrices.map((line) => (
                        <p key={line} className="leading-snug">
                          {line}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </>
              )
            ) : (
              <div className="space-y-1">
                <p className="leading-snug">Details coming soon.</p>
                {(isOwner || isAdmin) && (
                  <p className="text-xs text-gray-500">
                    Add these details in Manage venue.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="mt-auto flex flex-col gap-3 pt-6">
            {bookingUrl && bookingEnabled ? (
              <a
                href={bookingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 focus-visible:ring-offset-2"
              >
                Book Now
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600/60 px-5 text-sm font-semibold text-white"
              >
                Book Now
              </button>
            )}
            {!bookingEnabled ? (
              <p className="text-xs font-semibold text-slate-500">
                Bookings currently closed.
              </p>
            ) : null}
            {formattedBestForTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-500">
                  Best for:
                </span>
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
        </div>
        <div className={cardBase}>
          <div className="flex items-center gap-2">
            <Phone className={mutedIconClassName} strokeWidth={2.25} />
            <h3 className="text-base font-semibold text-gray-800">Contact Us</h3>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            {contactPhone ? (
              <>
                <a
                  href={`tel:${contactPhone}`}
                  className={`${linkClassName} text-blue-700 group-hover:text-blue-800`}
                >
                  {contactPhone}
                </a>
                <p className="leading-snug">Call for booking questions.</p>
                <p className="text-xs text-slate-500 opacity-0 transition group-hover:opacity-100">
                  Click to call
                </p>
              </>
            ) : (
              <div className="space-y-1">
                <p className="leading-snug">Details coming soon.</p>
                {(isOwner || isAdmin) && (
                  <p className="text-xs text-gray-500">
                    Add these details in Manage venue.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={cardBase}>
          <div className="flex items-center gap-2">
            <Globe2 className={mutedIconClassName} strokeWidth={2.25} />
            <h3 className="text-base font-semibold text-gray-800">
              Quick Links
            </h3>
          </div>
          <div className="mt-4 flex flex-col gap-2 text-sm text-gray-600">
            {websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className={actionRowClassName}
              >
                <span>Visit website</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
            ) : null}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className={actionRowClassName}
            >
              <span>Get directions</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </a>
            {!bookingUrl && !websiteUrl ? (
              (isOwner || isAdmin) && (
                <p className="text-xs text-gray-500">
                  Add these details in Manage venue.
                </p>
              )
            ) : null}
          </div>
        </div>
        <div className={`md:col-span-3 md:row-start-3 ${cardBase}`}>
          <div className="flex items-center gap-2">
            <Wrench className={mutedIconClassName} strokeWidth={2.25} />
            <h3 className="text-base font-semibold text-gray-800">Facilities</h3>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {facilitiesList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {facilitiesList.map((facility) => {
                  const FacilityIcon = resolveFacilityIcon(facility);
                  return (
                    <span
                      key={facility}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      <FacilityIcon
                        className="h-4 w-4 text-blue-600"
                        strokeWidth={2.25}
                      />
                      {facility}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                <p className="leading-snug">Details coming soon.</p>
                {(isOwner || isAdmin) && (
                  <p className="text-xs text-gray-500">
                    Add these details in Manage venue.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className={cardBase}>
          <div className="flex items-center gap-2">
            <Clock className={mutedIconClassName} strokeWidth={2.25} />
            <h3 className="text-base font-semibold text-gray-800">
              Opening hours
            </h3>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {isOperationalLoading && openingHours.length === 0 ? (
              <div className="space-y-2">
                <div className="h-4 w-28 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 w-3/4 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
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
                            <span className="font-medium text-slate-600">
                              {label}
                            </span>
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
              <p className="leading-snug text-slate-500">
                No opening hours posted yet.
              </p>
            )}
          </div>
        </div>
        <div className={cardBase}>
          <div className="flex items-center gap-2">
            <ScrollText className={mutedIconClassName} strokeWidth={2.25} />
            <h3 className="text-base font-semibold text-gray-800">
              Rules & tackle
            </h3>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {isOperationalLoading && !hasRulesText ? (
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
              </div>
            ) : hasRulesText ? (
              <MarkdownContent
                content={rulesText ?? ""}
                className="text-sm text-slate-700"
              />
            ) : (
              <p className="leading-snug text-slate-500">
                No rules posted yet.
              </p>
            )}
          </div>
        </div>
      </div>
      {!hasPlanContent && (isOwner || isAdmin) ? (
        <p className="text-base text-gray-600">
          Owners can add contact, booking, and facilities details from Edit /
          Manage venue.
        </p>
      ) : null}
    </Section>
  ) : null;
};

export default PlanYourVisitSection;
