const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const sourcePath = path.resolve(__dirname, '../utils/doctrines.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath; loaded.paths = module.paths;
loaded._compile(compiled, sourcePath);
const { doctrineCategories, canEditDoctrines, selectedDoctrine, setDoctrine } = loaded.exports;

const fresh = () => ({ DoctrineUnlockedUpgrades: [], UnlockedUpgrades: [9000], CultTraits: [8000], Followers: [{ ID: 10 }] });

test('catalog contains 24 doctrine pairs with unique native DoctrineType IDs', () => {
    const pairs = doctrineCategories.flatMap(category => category.pairs);
    const ids = pairs.flatMap(pair => [pair.left.id, pair.right.id]);
    assert.equal(pairs.length, 24);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.length, 48);
    assert.ok(ids.every(id => (id >= 6 && id <= 45) || (id >= 53 && id <= 60)));
});

test('choosing an option replaces its opposite and synchronizes unlock and trait fields', () => {
    const pair = doctrineCategories[0].pairs[1];
    const save = fresh();
    setDoctrine(save, pair, pair.right.id);
    assert.deepEqual(save.DoctrineUnlockedUpgrades, [pair.right.id]);
    assert.ok(save.UnlockedUpgrades.includes(pair.right.upgradeId));
    assert.ok(!save.UnlockedUpgrades.includes(pair.left.upgradeId));
    const once = JSON.stringify(save);
    setDoctrine(save, pair, pair.right.id);
    assert.equal(JSON.stringify(save), once);
});

test('switching a pair removes the opposing doctrine, upgrade and CultTrait only', () => {
    const pair = doctrineCategories[0].pairs[0];
    const save = fresh();
    setDoctrine(save, pair, pair.left.id);
    setDoctrine(save, pair, pair.right.id);
    assert.equal(selectedDoctrine(pair, save), pair.right.id);
    assert.ok(!save.DoctrineUnlockedUpgrades.includes(pair.left.id));
    assert.ok(save.DoctrineUnlockedUpgrades.includes(pair.right.id));
    assert.ok(!save.CultTraits.includes(pair.left.cultTraitId));
    assert.ok(save.CultTraits.includes(pair.right.cultTraitId));
    assert.deepEqual(save.UnlockedUpgrades, [9000]);
    assert.deepEqual(save.Followers, [{ ID: 10 }]);
});

test('clearing a pair removes both choices and their mapped side effects; conflicts are reported until resolved', () => {
    const pair = doctrineCategories[2].pairs[1];
    const save = fresh();
    save.DoctrineUnlockedUpgrades = [pair.left.id, pair.right.id, 9999];
    save.CultTraits.push(pair.left.cultTraitId, pair.right.cultTraitId);
    assert.equal(selectedDoctrine(pair, save), 'conflict');
    setDoctrine(save, pair, null);
    assert.equal(selectedDoctrine(pair, save), null);
    assert.deepEqual(save.DoctrineUnlockedUpgrades, [9999]);
    assert.deepEqual(save.CultTraits, [8000]);
});

test('unsupported save fields are rejected without mutation', () => {
    const save = { DoctrineUnlockedUpgrades: [], UnlockedUpgrades: [], CultTraits: {} };
    assert.equal(canEditDoctrines(save), false);
    const before = JSON.stringify(save);
    assert.throws(() => setDoctrine(save, doctrineCategories[0].pairs[0], 30));
    assert.equal(JSON.stringify(save), before);
});
