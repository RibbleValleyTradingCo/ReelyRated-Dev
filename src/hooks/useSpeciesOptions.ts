import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UK_FRESHWATER_SPECIES } from "@/lib/freshwater-data";

export type SpeciesOption = {
  value: string;
  label: string;
};

type UseSpeciesOptionsParams = {
  onlyWithCatches?: boolean;
  includeOther?: boolean;
};

const buildFallbackOptions = (includeOther: boolean): SpeciesOption[] => {
  const options = UK_FRESHWATER_SPECIES.map((species) => ({
    value: species.value,
    label: species.label,
  }));

  if (includeOther && !options.some((option) => option.value === "other")) {
    options.push({ value: "other", label: "Other" });
  }

  return options;
};

const normalizeOptions = (rows: Array<{ slug?: string | null; label?: string | null }>, includeOther: boolean) => {
  const options = rows
    .filter((row) => row.slug && row.label)
    .map((row) => ({
      value: String(row.slug),
      label: String(row.label),
    }));

  if (includeOther && !options.some((option) => option.value === "other")) {
    options.push({ value: "other", label: "Other" });
  }

  return options;
};

export const useSpeciesOptions = ({ onlyWithCatches = false, includeOther = false }: UseSpeciesOptionsParams = {}) => {
  const fallbackOptions = useMemo(
    () => buildFallbackOptions(includeOther),
    [includeOther],
  );
  const [options, setOptions] = useState<SpeciesOption[]>(fallbackOptions);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setIsFallback(false);

      const { data, error } = await supabase.rpc("get_species_options", {
        p_only_active: true,
        p_only_with_catches: onlyWithCatches,
      });

      if (!active) return;

      if (error || !Array.isArray(data)) {
        setOptions(fallbackOptions);
        setIsFallback(true);
        setIsLoading(false);
        return;
      }

      const normalized = normalizeOptions(data, includeOther);
      if (normalized.length === 0) {
        setOptions(fallbackOptions);
        setIsFallback(true);
      } else {
        setOptions(normalized);
      }
      setIsLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [onlyWithCatches, includeOther, fallbackOptions]);

  return {
    options,
    isLoading,
    isFallback,
  };
};

export default useSpeciesOptions;
