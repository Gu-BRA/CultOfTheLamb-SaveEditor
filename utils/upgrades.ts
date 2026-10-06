import catalog from '../public/data/upgradeTrees.json';

export type Upgrade = typeof catalog.trees[number]['upgrades'][number];
export type UpgradeTree = typeof catalog.trees[number];
export const upgradeTrees: UpgradeTree[] = catalog.trees;
type Save = Record<string, unknown>;

const keyFor = (save: Save, name: string) => Object.keys(save).find(k => k.toLowerCase() === name.toLowerCase());

export function canEditUpgrades(save: unknown): save is Save {
    if (!save || typeof save !== 'object') return false;
    const key = keyFor(save as Save, 'UnlockedUpgrades');
    return !!key && Array.isArray((save as Save)[key]) &&
        ((save as Save)[key] as unknown[]).every(id => Number.isInteger(id));
}

export function unlockedUpgrades(save: unknown): number[] {
    if (!canEditUpgrades(save)) return [];
    return save[keyFor(save, 'UnlockedUpgrades')!] as number[];
}

// Native node prerequisites, progression bridges, and story gates are distinct.
// All use UpgradeSystem.Type in UnlockedUpgrades; ritual and crown enums do not.
export function upgradeDependencies(tree: UpgradeTree, row: Upgrade): number[] {
    return [...new Set([
        ...row.parents,
        ...tree.tiers.filter(tier => tier._tier <= row.tier).map(tier => tier._centralNode),
        ...(row.requiresUpgrade ? [row.requiresUpgrade] : []),
    ])].filter(id => id !== row.id);
}

export function setUpgrade(save: Save, tree: UpgradeTree, id: number, enabled: boolean): void {
    if (!canEditUpgrades(save) || !tree.upgrades.some(row => row.id === id)) {
        throw new Error('Unsupported upgrade or save format');
    }
    const original = unlockedUpgrades(save);
    const ids = new Set(original);
    const byId = new Map(tree.upgrades.map(row => [row.id, row]));
    if (enabled) {
        const visited = new Set<number>();
        const enable = (selected: number) => {
            if (visited.has(selected)) return;
            visited.add(selected);
            const row = byId.get(selected);
            if (row) upgradeDependencies(tree, row).forEach(enable);
            ids.add(selected);
        };
        enable(id);
    } else {
        const removed = new Set([id]);
        // Removing a prerequisite also removes its dependent nodes in this tree.
        // Other trees, story gates, and unknown future IDs are preserved.
        let changed = true;
        while (changed) {
            changed = false;
            for (const row of tree.upgrades) {
                if (!removed.has(row.id) && upgradeDependencies(tree, row).some(parent => removed.has(parent))) {
                    removed.add(row.id);
                    changed = true;
                }
            }
        }
        removed.forEach(selected => ids.delete(selected));
    }
    if (original.length === ids.size && original.every(selected => ids.has(selected))) return;
    save[keyFor(save, 'UnlockedUpgrades')!] = [...ids];
    const tierKey = keyFor(save, tree.tierField);
    if (tierKey && Number.isInteger(save[tierKey])) {
        const tier = Math.max(0, ...tree.tiers.filter(t => ids.has(t._centralNode)).map(t => t._tier));
        save[tierKey] = enabled ? Math.max(save[tierKey] as number, tier) : tier;
    }
}
