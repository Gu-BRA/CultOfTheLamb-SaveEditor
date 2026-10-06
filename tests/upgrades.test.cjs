const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const sourcePath = path.resolve(__dirname, '../utils/upgrades.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath;
loaded.paths = module.paths;
loaded._compile(compiled, sourcePath);
const { upgradeTrees, setUpgrade, unlockedUpgrades, canEditUpgrades } = loaded.exports;
const [divine, sermons] = upgradeTrees;

test('native catalog contains only the two requested trees with complete local artwork', () => {
    assert.deepEqual(upgradeTrees.map(t => [t.key, t.upgrades.length]), [['divine', 69], ['sermons', 32]]);
    for (const tree of upgradeTrees) for (const row of tree.upgrades) {
        assert.ok(row.name && row.description && row.image);
        assert.ok(fs.existsSync(path.resolve(__dirname, '../public' + row.image)));
    }
});

test('late Sermon unlock includes native parents and tier bridges, preserving unrelated save fields', () => {
    const save = { UnlockedUpgrades: [42, 9999], CurrentUpgradeTreeTier: 0,
        CurrentPlayerUpgradeTreeTier: 0, WeaponAbilityPoints: 5, Followers: [{ ID: 10 }],
        UnlockedSermonsAndRituals: [9], CrownAbilitiesUnlocked: [], UnlockedStructures: [357] };
    const untouched = JSON.stringify(save);
    setUpgrade(save, sermons, 256, true);
    for (const id of [42, 9999, 157, 223, 158, 224, 225, 226, 240, 256]) assert.ok(save.UnlockedUpgrades.includes(id));
    assert.equal(save.CurrentPlayerUpgradeTreeTier, 5);
    const original = JSON.parse(untouched);
    for (const key of Object.keys(original).filter(k => !['UnlockedUpgrades', 'CurrentPlayerUpgradeTreeTier'].includes(k))) {
        assert.deepEqual(save[key], original[key]);
    }
    const once = JSON.stringify(save);
    setUpgrade(save, sermons, 256, true);
    assert.equal(JSON.stringify(save), once);
});

test('Divine Inspiration uses native story gates without replacing followers or placed buildings', () => {
    const save = { unlockedupgrades: [157, 9999], currentupgradetreetier: 0, BaseStructures: [{ ID: 123 }] };
    setUpgrade(save, divine, 274, true);
    for (const id of [42, 64, 34, 83, 84, 263, 265, 274]) assert.ok(unlockedUpgrades(save).includes(id));
    assert.equal(save.currentupgradetreetier, 4);
    assert.deepEqual(save.BaseStructures, [{ ID: 123 }]);
    assert.equal(Object.hasOwn(save, 'UnlockedUpgrades'), false);
});

test('removing a prerequisite removes its descendants in the selected tree, preserving unknown IDs and the other tree', () => {
    const save = { UnlockedUpgrades: [9999], CurrentUpgradeTreeTier: 0, CurrentPlayerUpgradeTreeTier: 0 };
    for (const tree of upgradeTrees) for (const row of tree.upgrades) setUpgrade(save, tree, row.id, true);
    assert.ok(upgradeTrees.every(tree => tree.upgrades.every(row => unlockedUpgrades(save).includes(row.id))));
    setUpgrade(save, divine, 42, false);
    assert.ok(divine.upgrades.every(row => !unlockedUpgrades(save).includes(row.id)));
    assert.ok(sermons.upgrades.every(row => unlockedUpgrades(save).includes(row.id)));
    assert.ok(unlockedUpgrades(save).includes(9999));
    assert.equal(save.CurrentPlayerUpgradeTreeTier, 5);
    assert.equal(save.CurrentUpgradeTreeTier, 0);
});

test('unsupported arrays and unknown upgrades are rejected before mutation', () => {
    for (const save of [{}, { UnlockedUpgrades: {} }, { UnlockedUpgrades: ['42'] }]) {
        assert.equal(canEditUpgrades(save), false);
        const before = JSON.stringify(save);
        assert.throws(() => setUpgrade(save, divine, 42, true));
        assert.equal(JSON.stringify(save), before);
    }
    const save = { UnlockedUpgrades: [42] };
    assert.throws(() => setUpgrade(save, divine, 9999, true));
    assert.deepEqual(save.UnlockedUpgrades, [42]);
});
