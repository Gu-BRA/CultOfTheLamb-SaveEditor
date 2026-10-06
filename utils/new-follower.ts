import cloneDeep from 'lodash/cloneDeep';

type FollowerSkin = { name: string; variant: string[] };
type FollowerColors = { id: number; colors: unknown[]; lockColor?: number };
type RecordLike = Record<string, any>;

function findKey(value: RecordLike, key: string) {
  return Object.keys(value).find(candidate => candidate.toLowerCase() === key.toLowerCase());
}

function getCaseInsensitive(value: RecordLike, key: string): any {
  const actual = findKey(value, key);
  return actual ? value[actual] : undefined;
}

function setCaseInsensitive(value: RecordLike, key: string, next: unknown) {
  value[findKey(value, key) ?? key] = next;
}

export function nextUnusedFollowerId(save: RecordLike): number {
  const used = new Set<number>();
  for (const key of ['Followers', 'Followers_Dead', 'Followers_Recruit']) {
    const followers = getCaseInsensitive(save, key);
    if (!Array.isArray(followers)) continue;
    for (const follower of followers) {
      const id = Number(getCaseInsensitive(follower, 'ID'));
      if (Number.isSafeInteger(id) && id > 0) used.add(id);
    }
  }

  const counter = Number(getCaseInsensitive(save, 'FollowerID'));
  const highestUsed = used.size ? Math.max(...used) : 0;
  let candidate = Math.max(1, highestUsed + 1, Number.isSafeInteger(counter) ? counter : 1);
  while (used.has(candidate)) candidate++;
  return candidate;
}

function pick<T>(values: T[], random: () => number): T {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))];
}

export function createRandomFollower(
  save: RecordLike,
  name: string,
  skins: FollowerSkin[],
  colorGroups: FollowerColors[],
  random: () => number = Math.random,
) {
  const followers = getCaseInsensitive(save, 'Followers');
  if (!Array.isArray(followers)) throw new Error('The save does not contain a Followers array.');

  const template = followers[0]
    ?? getCaseInsensitive(save, 'Followers_Recruit')?.[0]
    ?? getCaseInsensitive(save, 'Followers_Dead')?.[0];
  if (!template || typeof template !== 'object') throw new Error('No follower template exists in this save.');

  const eligibleSkins = skins.flatMap((skin, index) => {
    const colors = colorGroups.find(group => group.id === index);
    const variants = (skin.variant ?? []).filter(variant => variant && !/^unknown skin/i.test(variant));
    if (!colors?.colors?.length || colors.lockColor || /^(Boss|CultLeader)/i.test(skin.name) || !variants.length) return [];
    return [{ index, variants, colors: colors.colors }];
  });
  if (!eligibleSkins.length) throw new Error('No random follower forms are available.');

  const skin = pick(eligibleSkins, random);
  const variantIndex = Math.floor(random() * skin.variants.length);
  const id = nextUnusedFollowerId(save);
  const follower = cloneDeep(template) as RecordLike;

  const defaults: Record<string, unknown> = {
    ID: id,
    Name: name.trim(),
    XPLevel: 1,
    FollowerLevel: 0,
    MaxLevelReached: false,
    Age: 1,
    LifeExpectancy: 100,
    OldAge: false,
    DayJoined: 1,
    MemberDuration: 1,
    SacrificialValue: 1,
    Outfit: 18,
    SkinCharacter: skin.index,
    SkinVariation: variantIndex,
    SkinColour: Math.floor(random() * skin.colors.length),
    SkinName: skin.variants[variantIndex],
    Clothing: 0,
    ClothingVariant: '',
    Necklace: 0,
    Traits: [],
    TraitsSet: true,
    Adoration: 0,
    DevotionGiven: 0,
    Faith: 100,
    Happiness: 100,
    Illness: 0,
    Reeducation: 100,
    Exhaustion: 0,
    Rest: 100,
    Starvation: 0,
    Satiation: 100,
    Dissent: 0,
    DissentDuration: -1,
    HP: 25,
    MaxHP: 25,
    IsStarving: false,
    IsDisciple: false,
    MarriedToLeader: false,
    TaxEnforcer: false,
    FaithEnforcer: false,
    LeavingCult: false,
    DiedOfIllness: false,
    DiedOfOldAge: false,
    DiedOfStarvation: false,
    DiedFromTwitchChat: false,
    DiedInPrison: false,
    CursedState: 0,
    StartingCursedState: 0,
    CursedStateVariant: 0,
    Faction: 3,
    FollowerRole: 2,
    Relationships: [],
    Thoughts: [],
    Inventory: [],
    TaskMemory: [],
    ReactionsAndTime: [],
    PrayProgress: 0,
    CurrentPlayerQuest: null,
    ViewerID: null,
    DwellingID: 0,
    PreviousDwellingID: 0,
    DwellingLevel: 0,
    DwellingSlot: 0,
  };
  for (const [key, value] of Object.entries(defaults)) setCaseInsensitive(follower, key, value);

  const currentCounter = Number(getCaseInsensitive(save, 'FollowerID'));
  if (!Number.isSafeInteger(currentCounter) || currentCounter <= id) {
    setCaseInsensitive(save, 'FollowerID', id + 1);
  }
  return follower;
}
