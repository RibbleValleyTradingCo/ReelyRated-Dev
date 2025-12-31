export type Venue = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  short_tagline: string | null;
  ticket_type: string | null;
  price_from: string | null;
  facilities: string[] | null;
  website_url: string | null;
  booking_url: string | null;
  booking_enabled?: boolean | null;
  contact_phone: string | null;
  payment_methods?: string[] | null;
  payment_notes?: string | null;
  total_catches: number | null;
  recent_catches_30d: number | null;
  active_anglers_all_time?: number | null;
  active_anglers_30d?: number | null;
  headline_pb_weight: number | null;
  headline_pb_unit: string | null;
  headline_pb_species: string | null;
  top_species: string[] | null;
  avg_rating: number | null;
  rating_count: number | null;
  is_published?: boolean | null;
};

export type VenueOpeningHour = {
  id: string;
  venue_id: string;
  label: string | null;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type VenuePricingTier = {
  id: string;
  venue_id: string;
  label: string;
  price: string;
  unit: string | null;
  audience?: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type VenueSpeciesStock = {
  id: string;
  venue_id: string;
  species_name: string;
  record_weight: number | null;
  record_unit: string | null;
  avg_weight: number | null;
  size_range_min: number | null;
  size_range_max: number | null;
  stock_density: string | null;
  stock_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VenueRules = {
  venue_id: string;
  rules_text: string | null;
  created_at: string;
  updated_at: string;
};

export type VenuePhoto = {
  id: string;
  venue_id: string;
  image_path: string;
  caption: string | null;
  is_primary?: boolean | null;
  created_at: string;
  created_by: string | null;
};

export type CatchRow = {
  id: string;
  title: string;
  image_url: string;
  user_id: string;
  location: string | null;
  species: string | null;
  weight: number | null;
  weight_unit: string | null;
  visibility: string | null;
  hide_exact_spot: boolean | null;
  conditions: Record<string, unknown> | null;
  created_at: string;
  profiles: {
    username: string;
    avatar_path: string | null;
    avatar_url: string | null;
  };
  ratings: { rating: number }[];
  comments: { id: string }[];
  reactions: { user_id: string }[] | null;
  venues?: {
    id?: string;
    slug: string;
    name: string;
  } | null;
};

export type VenueEvent = {
  id: string;
  venue_id: string;
  title: string;
  event_type: string | null;
  starts_at: string;
  ends_at: string | null;
  description: string | null;
  ticket_info: string | null;
  website_url: string | null;
  booking_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};
