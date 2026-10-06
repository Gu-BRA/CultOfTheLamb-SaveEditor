import catalog from '../public/data/buildings.json';
import { canEditUpgrades, setUpgrade, unlockedUpgrades, upgradeTrees } from './upgrades';
export const buildings = catalog;
export type Building = typeof catalog[number];
type Save = Record<string, unknown>;
const keyFor = (save: Save, name: string) => Object.keys(save).find(key => key.toLowerCase() === name.toLowerCase());
const get = (save: Save, name: string) => save[keyFor(save, name) ?? name];
const numericList = (value: unknown): value is number[] => Array.isArray(value) && value.every(Number.isInteger);
export function buildingEnabled(save: unknown, row: Building): boolean {
    const condition = row.unlock;
    if (condition.kind === 'builtin') return !!condition.enabled;
    if (!save || typeof save !== 'object') return false;
    const data = save as Save;
    if (condition.kind === 'flag') return get(data, condition.field!) === true;
    if (condition.kind === 'upgrade') return unlockedUpgrades(data).includes(condition.id!);
    const list = get(data, 'UnlockedStructures');
    return numericList(list) && list.includes(row.id);
}
export function canEditBuilding(save: unknown, row: Building): save is Save {
    if (!save || typeof save !== 'object') return false;
    const data = save as Save;
    if (row.unlock.kind === 'builtin') return false;
    if (row.unlock.kind === 'upgrade') return canEditUpgrades(data);
    if (row.unlock.kind === 'flag') return typeof get(data, row.unlock.field!) === 'boolean';
    return numericList(get(data, 'UnlockedStructures'));
}
export function setBuilding(save: Save, row: Building, enabled: boolean): void {
    if (!buildings.some(building => building.id === row.id) || !canEditBuilding(save, row)) {
        throw new Error('Unsupported building or save format');
    }
    if (row.unlock.kind === 'flag') {
        save[keyFor(save, row.unlock.field!)!] = enabled;
        return;
    }
    if (row.unlock.kind === 'upgrade') {
        const tree = upgradeTrees.find(tree => tree.upgrades.some(upgrade => upgrade.id === row.unlock.id));
        if (tree) { setUpgrade(save, tree, row.unlock.id!, enabled); return; }
    }
    const field = row.unlock.kind === 'upgrade' ? 'UnlockedUpgrades' : 'UnlockedStructures';
    const id = row.unlock.kind === 'upgrade' ? row.unlock.id! : row.id;
    const list = get(save, field) as number[];
    if (enabled && !list.includes(id)) save[keyFor(save, field)!] = [...list, id];
    if (!enabled && list.includes(id)) save[keyFor(save, field)!] = list.filter(value => value !== id);
}
