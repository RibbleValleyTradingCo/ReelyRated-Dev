-- Normalize day_of_week to Postgres convention: 0=Sunday ... 6=Saturday
UPDATE public.venue_opening_hours
SET day_of_week = (day_of_week + 1) % 7
WHERE day_of_week IS NOT NULL;
