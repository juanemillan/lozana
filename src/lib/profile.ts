export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'] as const;

export const SKIN_TYPES = ['Seca', 'Mixta', 'Grasa', 'Normal', 'Sensible'] as const;

export const CONCERNS = [
  'Líneas de expresión',
  'Manchas',
  'Acné',
  'Poros dilatados',
  'Rojeces',
  'Opacidad',
  'Deshidratación',
] as const;

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  age_range: string | null;
  skin_type: string | null;
  concerns: string[];
  sensitivities: string | null;
  goal: string | null;
  avatar_path: string | null;
  onboarding_completed_at: string | null;
};

/** Campos que edita el onboarding. El resto los maneja Supabase. */
export type ProfileDraft = Pick<
  Profile,
  'full_name' | 'age_range' | 'skin_type' | 'concerns' | 'sensitivities' | 'goal'
>;

export const EMPTY_DRAFT: ProfileDraft = {
  full_name: '',
  age_range: null,
  skin_type: null,
  concerns: [],
  sensitivities: '',
  goal: '',
};

export function draftFrom(profile: Profile | null): ProfileDraft {
  if (!profile) return EMPTY_DRAFT;
  return {
    full_name: profile.full_name ?? '',
    age_range: profile.age_range,
    skin_type: profile.skin_type,
    concerns: profile.concerns ?? [],
    sensitivities: profile.sensitivities ?? '',
    goal: profile.goal ?? '',
  };
}

/** Iniciales para el avatar cuando todavía no hay foto. */
export function initials(profile: Profile | null, email?: string) {
  const source = profile?.full_name?.trim() || email || '';
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}
