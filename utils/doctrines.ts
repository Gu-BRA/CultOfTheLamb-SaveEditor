export type DoctrineOption = {
  id: number;
  name: string;
  description: string;
  upgradeId?: number;
  cultTraitId?: number;
};

export type DoctrinePair = { name: string; left: DoctrineOption; right: DoctrineOption };
export type DoctrineCategory = { name: string; pairs: DoctrinePair[] };
type Save = Record<string, unknown>;

// IDs are DoctrineType values from the installed game's metadata. The linked
// upgrade and CultTrait IDs follow the game's save fields (and Wheels35's map).
export const doctrineCategories: DoctrineCategory[] = [
  { name: 'Afterlife', pairs: [
    { name: 'Afterlife I', left: { id: 30, name: 'Belief in Sacrifice', description: 'Gain 20 Faith when another follower is sacrificed.', cultTraitId: 9 }, right: { id: 31, name: 'Belief in Afterlife', description: 'Lose 5 Faith instead of 20 when a follower dies.', cultTraitId: 3 } },
    { name: 'Afterlife II', left: { id: 32, name: 'Ritual of Resurrection', description: 'Unlock the ritual that brings a dead follower back to life.', upgradeId: 110 }, right: { id: 33, name: 'Funeral', description: 'Unlock the funeral ritual for a recently deceased follower.', upgradeId: 111 } },
    { name: 'Afterlife III', left: { id: 34, name: 'Respect Your Elders', description: 'Gain Faith when a follower becomes an elder.', cultTraitId: 30 }, right: { id: 35, name: 'Good Die Young', description: 'Gain Faith from sacrificing an elder, but lose Faith when one dies naturally.', cultTraitId: 31 } },
    { name: 'Afterlife IV', left: { id: 36, name: 'Return to the Earth', description: 'Unlock the natural burial building.', upgradeId: 53 }, right: { id: 37, name: 'Grieve the Fallen', description: 'Unlock graves where followers can grieve.', upgradeId: 57 } },
  ] },
  { name: 'Work and Worship', pairs: [
    { name: 'Work and Worship I', left: { id: 10, name: 'Faithful', description: 'Followers generate Devotion 15% faster.', cultTraitId: 11 }, right: { id: 11, name: 'Industrious', description: 'Followers work 15% faster.', cultTraitId: 24 } },
    { name: 'Work and Worship II', left: { id: 6, name: 'Inspire', description: 'Unlock the Inspire follower command.' }, right: { id: 7, name: 'Intimidate', description: 'Unlock the Intimidate follower command.' } },
    { name: 'Work and Worship III', left: { id: 8, name: 'The Glory of Construction', description: 'Unlock the ritual that completes all ongoing construction.', upgradeId: 100 }, right: { id: 9, name: 'Ritual of Enlightenment', description: 'Unlock a ritual that increases Shrine Devotion generation.', upgradeId: 101 } },
    { name: 'Work and Worship IV', left: { id: 12, name: 'Glory Through Toil', description: 'Unlock a ritual that lets followers work for two days without tiring.', upgradeId: 102 }, right: { id: 13, name: 'Holy Day', description: 'Unlock a ritual that gives followers a day of rest and grants Faith.', upgradeId: 103 } },
  ] },
  { name: 'Possessions', pairs: [
    { name: 'Possessions I', left: { id: 14, name: 'Extort Tithes', description: 'Unlock the command to collect Coins from a follower.', }, right: { id: 15, name: 'Bribe Follower', description: 'Unlock the command to bribe a follower with Coins.' } },
    { name: 'Possessions II', left: { id: 18, name: 'Belief in Materialism', description: 'Gain Faith when building better sleeping quarters.', cultTraitId: 18 }, right: { id: 19, name: 'Belief in False Idols', description: 'Gain Faith when building decorations.', cultTraitId: 19 } },
    { name: 'Possessions III', left: { id: 20, name: 'Alms for the Poor', description: 'Unlock a ritual that gives Coins to followers and grants Faith.', upgradeId: 104 }, right: { id: 21, name: 'Ritual of Enrichment', description: 'Unlock a ritual in which followers donate Coins to you.', upgradeId: 105 } },
    { name: 'Possessions IV', left: { id: 16, name: 'Sacral Architecture', description: 'Gain Faith when a building is constructed.', cultTraitId: 27 }, right: { id: 17, name: 'Devotee', description: 'Gain more Faith when preaching a Sermon.', cultTraitId: 26 } },
  ] },
  { name: 'Law and Order', pairs: [
    { name: 'Law and Order I', left: { id: 38, name: 'Murder Follower', description: 'Unlock the Murder follower command.' }, right: { id: 39, name: 'Ascend Follower', description: 'Unlock the ritual to ascend a follower.', upgradeId: 154 } },
    { name: 'Law and Order II', left: { id: 40, name: 'Ritualistic Fight Pit', description: 'Unlock a ritual where two followers fight.', upgradeId: 112 }, right: { id: 41, name: 'Wedding', description: 'Unlock the Wedding ritual.', upgradeId: 113 } },
    { name: 'Law and Order III', left: { id: 44, name: 'Belief in Original Sin', description: 'Reduce Faith loss for imprisoning a follower who is not dissenting.', cultTraitId: 7 }, right: { id: 45, name: 'Belief in Absolution', description: 'Gain Faith each day that begins with no followers in prison.', cultTraitId: 8 } },
    { name: 'Law and Order IV', left: { id: 42, name: 'Loyalty Enforcer', description: 'Unlock the ritual to appoint a Loyalty Enforcer.', upgradeId: 114 }, right: { id: 43, name: 'Tax Enforcer', description: 'Unlock the ritual to appoint a Tax Enforcer.', upgradeId: 115 } },
  ] },
  { name: 'Sustenance', pairs: [
    { name: 'Sustenance I', left: { id: 22, name: 'Ritual Fast', description: 'Unlock a ritual that prevents followers from eating for three days.', upgradeId: 106 }, right: { id: 23, name: 'Feasting Ritual', description: 'Unlock a feast that fills hunger and grants Faith.', upgradeId: 107 } },
    { name: 'Sustenance II', left: { id: 26, name: 'Cannibal', description: 'Gain Faith when a follower eats a meal made with follower meat.', cultTraitId: 5 }, right: { id: 27, name: 'Grass Eater', description: 'Followers do not lose Faith when eating a Grass Meal.', cultTraitId: 6 } },
    { name: 'Sustenance III', left: { id: 28, name: 'Ritual of the Harvest', description: 'Unlock a ritual that makes all crops ready to harvest.', upgradeId: 108 }, right: { id: 29, name: "Ritual of the Ocean's Bounty", description: 'Unlock a ritual that improves fishing for two days.', upgradeId: 109 } },
    { name: 'Sustenance IV', left: { id: 24, name: 'Substances Encouraged', description: 'Gain Faith when performing the Brainwashing Ritual.', cultTraitId: 28 }, right: { id: 25, name: 'Belief in Prohibitionism', description: 'Increase work speed and Devotion, with a chance of sickness after brainwashing.', cultTraitId: 29 } },
  ] },
  { name: 'Sins', pairs: [
    { name: 'Sins I', left: { id: 53, name: 'Rite of Lust', description: 'Unlock a ritual that generates Sin through a dance.', upgradeId: 268 }, right: { id: 54, name: 'Rite of Wrath', description: 'Unlock a ritual that generates Sin through a violent ceremony.', upgradeId: 267 } },
    { name: 'Sins II', left: { id: 60, name: "Sinner's Pride", description: 'Unlock a ritual that transfers followers’ Sin to one follower.', upgradeId: 277 }, right: { id: 59, name: 'Gluttony of Cannibals', description: 'Unlock a ritual that generates Sin by consuming a follower.', upgradeId: 276 } },
    { name: 'Sins III', left: { id: 55, name: 'Doctrinal Extremist', description: 'Generate Sin from the Confession Booth instead of Loyalty.', cultTraitId: 44 }, right: { id: 56, name: 'Violent Extremist', description: 'Gain a chance to find Sin after defeating mini-bosses.', cultTraitId: 45 } },
    { name: 'Sins IV', left: { id: 57, name: 'Born of Sin', description: 'Followers hatched in the cult are born with Sin.', cultTraitId: 46 }, right: { id: 58, name: 'Blind Allegiance', description: 'Followers hatched in the cult are born with high Loyalty.', cultTraitId: 47 } },
  ] },
];

const keyFor = (save: Save, name: string) => Object.keys(save).find(key => key.toLowerCase() === name.toLowerCase());
const field = (save: Save, name: string) => {
  const key = keyFor(save, name);
  return key && Array.isArray(save[key]) ? save[key] as number[] : undefined;
};

export function canEditDoctrines(save: unknown): save is Save {
  if (!save || typeof save !== 'object') return false;
  const object = save as Save;
  return ['DoctrineUnlockedUpgrades', 'UnlockedUpgrades', 'CultTraits'].every(name => !!field(object, name));
}

export function doctrineIds(save: unknown): number[] {
  return canEditDoctrines(save) ? field(save, 'DoctrineUnlockedUpgrades')! : [];
}

export function selectedDoctrineIds(pair: DoctrinePair, save: unknown): number[] {
  const ids = doctrineIds(save);
  const options = [pair.left, pair.right];
  const registered = options.filter(option => ids.includes(option.id)).map(option => option.id);
  if (registered.length) return registered;
  if (!canEditDoctrines(save)) return [];
  return options.filter(option =>
    (option.cultTraitId !== undefined && field(save, 'CultTraits')!.includes(option.cultTraitId)) ||
    (option.upgradeId !== undefined && field(save, 'UnlockedUpgrades')!.includes(option.upgradeId))
  ).map(option => option.id);
}

export function canEnableDoctrineOption(pair: DoctrinePair, save: unknown, optionId: number): boolean {
  if (!canEditDoctrines(save)) return false;
  const option = [pair.left, pair.right].find(item => item.id === optionId);
  if (!option) return false;
  const current = selectedDoctrineIds(pair, save);
  if (current.includes(optionId) || current.length === 0) return true;
  const saveObject = save as Save;
  const beatenKey = keyFor(saveObject, 'DeathCatBeaten');
  return beatenKey !== undefined && saveObject[beatenKey] === true;
}

export function selectedDoctrine(pair: DoctrinePair, save: unknown): number | null | 'conflict' {
  const ids = doctrineIds(save);
  const left = ids.includes(pair.left.id), right = ids.includes(pair.right.id);
  if (left && right) return 'conflict';
  if (left) return pair.left.id;
  if (right) return pair.right.id;
  // Older editor versions wrote the effect arrays without registering the
  // doctrine itself. Show these choices so they can be explicitly reconciled.
  if (canEditDoctrines(save)) {
    const effectEnabled = (option: DoctrineOption) =>
      (option.cultTraitId !== undefined && field(save, 'CultTraits')!.includes(option.cultTraitId)) ||
      (option.upgradeId !== undefined && field(save, 'UnlockedUpgrades')!.includes(option.upgradeId));
    const leftEffect = effectEnabled(pair.left), rightEffect = effectEnabled(pair.right);
    if (leftEffect && rightEffect) return 'conflict';
    if (leftEffect) return pair.left.id;
    if (rightEffect) return pair.right.id;
  }
  return null;
}

const levelFields = ['Doctrine_Afterlife_Level', 'Doctrine_WorkWorship_Level',
  'Doctrine_Possessions_Level', 'Doctrine_LawAndOrder_Level', 'Doctrine_Food_Level', 'Doctrine_Pleasure_Level'];

export function synchronizeDoctrineProgress(save: unknown): void {
  if (!canEditDoctrines(save)) return;
  const ids = doctrineIds(save);
  doctrineCategories.forEach((category, index) => {
    const highestTier = category.pairs.reduce((level, pair, tier) =>
      ids.includes(pair.left.id) || ids.includes(pair.right.id) ? tier + 1 : level, 0);
    const key = keyFor(save, levelFields[index]!);
    if (key && highestTier > 0 && Number.isInteger(save[key])) {
      save[key] = Math.max(save[key] as number, highestTier);
    }
  });
  if (ids.some(id => id >= 53 && id <= 60)) {
    for (const name of ['PleasureDoctrineEnabled', 'PleasureDoctrineOnboarded']) {
      const key = keyFor(save, name);
      if (key && typeof save[key] === 'boolean') save[key] = true;
    }
  }
}

export function synchronizeExistingDoctrines(save: unknown): void {
  if (!canEditDoctrines(save)) return;
  for (const category of doctrineCategories) for (const pair of category.pairs) {
    const selected = selectedDoctrineIds(pair, save);
    const saveObject = save as Save;
    const beatenKey = keyFor(saveObject, 'DeathCatBeaten');
    const hasPostGameUnlock = beatenKey !== undefined && saveObject[beatenKey] === true;
    const registered = doctrineIds(save);
    // Keep ambiguous legacy effects untouched until the game has unlocked
    // additional doctrine choices, rather than registering both prematurely.
    if (selected.length > 1 && !hasPostGameUnlock && selected.some(id => !registered.includes(id))) continue;
    for (const optionId of selected) setDoctrineOption(save, pair, optionId, true);
  }
  synchronizeDoctrineProgress(save);
}

function updateArray(save: Save, name: string, removeIds: number[], addId?: number) {
  const key = keyFor(save, name)!;
  const current = field(save, name)!;
  const next = current.filter(id => !removeIds.includes(id));
  if (addId !== undefined && !next.includes(addId)) next.push(addId);
  save[key] = next;
}

export function setDoctrine(save: unknown, pair: DoctrinePair, selectedId: number | null): void {
  if (!canEditDoctrines(save)) throw new Error('This save does not contain the required doctrine fields.');
  const options = [pair.left, pair.right];
  if (selectedId !== null && !options.some(option => option.id === selectedId)) throw new Error('Unsupported doctrine option.');
  const selected = options.find(option => option.id === selectedId);
  const opposite = selected ? options.find(option => option.id !== selected.id)! : undefined;
  const doctrineRemove = selected ? [opposite!.id] : options.map(option => option.id);
  updateArray(save, 'DoctrineUnlockedUpgrades', doctrineRemove, selected?.id);
  const upgradeRemove = (selected ? [opposite] : options).flatMap(option => option?.upgradeId === undefined ? [] : [option.upgradeId]);
  updateArray(save, 'UnlockedUpgrades', upgradeRemove, selected?.upgradeId);
  const traitRemove = (selected ? [opposite] : options).flatMap(option => option?.cultTraitId === undefined ? [] : [option.cultTraitId]);
  updateArray(save, 'CultTraits', traitRemove, selected?.cultTraitId);
  synchronizeDoctrineProgress(save);
}

export function setDoctrineOption(save: unknown, pair: DoctrinePair, optionId: number, enabled: boolean): void {
  if (!canEditDoctrines(save)) throw new Error('This save does not contain the required doctrine fields.');
  const option = [pair.left, pair.right].find(item => item.id === optionId);
  if (!option) throw new Error('Unsupported doctrine option.');
  if (enabled && !canEnableDoctrineOption(pair, save, optionId)) return;
  updateArray(save, 'DoctrineUnlockedUpgrades', [option.id], enabled ? option.id : undefined);
  if (option.upgradeId !== undefined) {
    updateArray(save, 'UnlockedUpgrades', [option.upgradeId], enabled ? option.upgradeId : undefined);
  }
  if (option.cultTraitId !== undefined) {
    updateArray(save, 'CultTraits', [option.cultTraitId], enabled ? option.cultTraitId : undefined);
  }
  synchronizeDoctrineProgress(save);
}
