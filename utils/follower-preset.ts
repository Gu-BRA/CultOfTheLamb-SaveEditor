// Explicit status allowlist: never copy IDs, appearance, housing or relationships.
export const followerStatusFields = [
  'XPLevel', 'Adoration', 'MaxLevelReached', 'Age', 'LifeExpectancy', 'OldAge',
  'SacrificialValue', 'IsDisciple', 'Traits', 'TraitsSet', 'MaxHP', 'HP',
  'Happiness', 'Faith', 'FearLove', 'Satiation', 'Starvation', 'IsStarving',
  'Bathroom', 'TargetBathroom', 'Social', 'Vomit', 'Rest', 'Illness', 'Injured',
  'Exhaustion', 'Drunk', 'IsDrunk', 'Dissent', 'DissentDuration', 'Reeducation',
  'IsFreezing', 'CursedState', 'StartingCursedState', 'CursedStateVariant',
] as const;

export function applyFollowerStatusPreset(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const field of followerStatusFields) {
    const value = source[field];
    if (field === 'Traits') {
      if (Array.isArray(value) && value.every(id => Number.isInteger(id))) target[field] = [...value];
    } else if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
      target[field] = value;
    }
  }
}
