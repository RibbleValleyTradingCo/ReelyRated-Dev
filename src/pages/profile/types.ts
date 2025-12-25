export interface Profile {
  id: string;
  username: string;
  avatar_path: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_private: boolean;
  is_deleted?: boolean;
}

export interface Catch {
  id: string;
  user_id?: string;
  location?: string | null;
  hide_exact_spot?: boolean | null;
  visibility?: string | null;
  title: string;
  image_url: string;
  ratings: { rating: number }[];
  weight: number | null;
  weight_unit: string | null;
  species: string | null;
  created_at: string;
  venues?: {
    id: string;
    slug: string;
    name: string;
  } | null;
}

export interface FollowingProfile {
  id: string;
  username: string;
  avatar_path: string | null;
  avatar_url: string | null;
  bio: string | null;
}
