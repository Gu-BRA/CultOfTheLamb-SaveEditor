const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const sourcePath = path.resolve(__dirname, '../utils/buildings.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath;
loaded.paths = module.paths;
const fallbackRequire = loaded.require.bind(loaded);
loaded.require = id => {
    if (id !== './upgrades') return fallbackRequire(id);
    const filename = path.resolve(__dirname, '../utils/upgrades.ts');
    const dependency = new Module(filename, module);
    dependency.filename = filename; dependency.paths = module.paths;
    dependency._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText, filename);
    return dependency.exports;
};
loaded._compile(compiled, sourcePath);
const { buildings, buildingEnabled, canEditBuilding, setBuilding } = loaded.exports;
const row = key => { const found = buildings.find(b => b.gameKey === key); assert.ok(found, key); return found; };
const fresh = () => ({ UnlockedUpgrades: [9999], UnlockedStructures: [9998], CurrentUpgradeTreeTier: 0,
    BuildShrineEnabled: true, BaseStructures: [{ ID: 9, Type: 2 }], HistoryOfStructures: [2], Followers: [{ ID: 10 }] });

test('catalog comes from the construction menu and excludes unbuildable temple variants', () => {
    assert.equal(buildings.length, 213);
    assert.equal(new Set(buildings.map(b => b.id)).size, buildings.length);
    assert.ok(buildings.every(b => b.name && b.description && b.image));
    assert.ok(!buildings.some(b => ['POOP', 'VOMIT', 'TEMPLE_IV'].includes(b.gameKey)));
    assert.equal(buildings.filter(b => b.imageSource === 'native').length, 207);
    assert.deepEqual(buildings.filter(b => b.imageSource === 'illustrative').map(b => b.id).sort((a,b) => a-b), [56, 73, 74, 171, 213, 214]);
    for (const b of buildings) assert.ok(fs.existsSync(path.resolve(__dirname, '../public'+b.image)));
});

test('buildings unlock their native upgrade and its prerequisites, sharing state with Divine Inspiration', () => {
    const save = fresh(), building = row('JANITOR_STATION_2');
    assert.equal(buildingEnabled(save, building), false);
    setBuilding(save, building, true);
    for (const id of [42, 64, 34, 83, 144, 260]) assert.ok(save.UnlockedUpgrades.includes(id));
    assert.equal(buildingEnabled(save, building), true);
    assert.equal(save.CurrentUpgradeTreeTier, 3);
    assert.ok(!save.UnlockedUpgrades.includes(84));
    const once = JSON.stringify(save); setBuilding(save, building, true); assert.equal(JSON.stringify(save), once);
    assert.deepEqual(save.UnlockedStructures, [9998]);
    assert.deepEqual(save.BaseStructures, [{ ID: 9, Type: 2 }]);
    assert.deepEqual(save.HistoryOfStructures, [2]);
    assert.deepEqual(save.Followers, [{ ID: 10 }]);
});

test('decoration unlock edits only UnlockedStructures, preserves unknown IDs, and supports lowercase keys', () => {
    const save = { unlockedstructures: [9998], unlockedupgrades: [9999], Followers: [] };
    const decoration = row('DECORATION_TORCH');
    assert.equal(decoration.unlock.kind, 'structure');
    setBuilding(save, decoration, true); assert.equal(buildingEnabled(save, decoration), true);
    assert.deepEqual(save.unlockedstructures, [9998, decoration.id]);
    assert.deepEqual(save.unlockedupgrades, [9999]);
    setBuilding(save, decoration, false); assert.deepEqual(save.unlockedstructures, [9998]);
    assert.equal(Object.hasOwn(save, 'UnlockedStructures'), false);
});

test('shared decoration-pack unlocks are read from the upgrade collection', () => {
    const save = fresh();
    setBuilding(save, row('DECORATION_STONE'), true);
    assert.equal(buildingEnabled(save, row('DECORATION_TREE')), true);
    assert.ok(save.UnlockedUpgrades.includes(139));
    assert.deepEqual(save.UnlockedStructures, [9998]);
});

test('default structures are readonly, the shrine uses its own flag, and unsupported saves cannot be changed', () => {
    const save = fresh(), kitchen = row('COOKING_FIRE'), shrine = row('SHRINE');
    assert.equal(buildingEnabled(save, kitchen), true);
    assert.equal(canEditBuilding(save, kitchen), false);
    assert.throws(() => setBuilding(save, kitchen, false));
    setBuilding(save, shrine, false); assert.equal(save.BuildShrineEnabled, false);
    assert.equal(buildingEnabled(save, shrine), false);
    const bad = { UnlockedStructures: ['103'] };
    assert.equal(canEditBuilding(bad, row('DECORATION_TORCH')), false);
    assert.throws(() => setBuilding(bad, row('DECORATION_TORCH'), true));
    assert.deepEqual(bad.UnlockedStructures, ['103']);
});
