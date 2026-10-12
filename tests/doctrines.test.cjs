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
const { doctrineCategories, canEditDoctrines, selectedDoctrine, setDoctrine, synchronizeExistingDoctrines } = loaded.exports;

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

test('legacy trait and ritual edits can be reconciled without changing stone counts or inventing choices', () => {
    const save = { DoctrineUnlockedUpgrades: [49, 50, 47, 32, 54],
        UnlockedUpgrades: [110, 267, 9999], CultTraits: [24, 18, 26, 30, 8000],
        Doctrine_WorkWorship_Level: 0, Doctrine_Possessions_Level: 0, Doctrine_Afterlife_Level: 2,
        Doctrine_Pleasure_Level: 0, PleasureDoctrineEnabled: false, PleasureDoctrineOnboarded: false,
        DoctrineCurrentCount: 15, DoctrineStoneTotalCount: 61, Followers: [{ ID: 10 }] };
    const before = JSON.stringify(save);
    assert.equal(selectedDoctrine(doctrineCategories[1].pairs[0], save), 11);
    assert.equal(JSON.stringify(save), before, 'reading an inferred choice must not change the save');
    synchronizeExistingDoctrines(save);
    for (const id of [11, 18, 17, 34, 54, 49, 50, 47, 32]) assert.ok(save.DoctrineUnlockedUpgrades.includes(id));
    assert.ok(!save.DoctrineUnlockedUpgrades.includes(6), 'do not invent Inspire or Intimidate');
    assert.ok(!save.DoctrineUnlockedUpgrades.includes(20), 'do not invent Alms or Enrichment');
    assert.equal(save.Doctrine_WorkWorship_Level, 1);
    assert.equal(save.Doctrine_Possessions_Level, 4);
    assert.equal(save.Doctrine_Afterlife_Level, 3);
    assert.equal(save.Doctrine_Pleasure_Level, 1);
    assert.equal(save.PleasureDoctrineEnabled, true);
    assert.equal(save.PleasureDoctrineOnboarded, true);
    assert.equal(save.DoctrineCurrentCount, 15);
    assert.equal(save.DoctrineStoneTotalCount, 61);
    assert.deepEqual(save.Followers, [{ ID: 10 }]);
    assert.ok(save.UnlockedUpgrades.includes(9999));
    assert.ok(save.CultTraits.includes(8000));
    const once = JSON.stringify(save);
    synchronizeExistingDoctrines(save);
    assert.equal(JSON.stringify(save), once);
});

test('ambiguous legacy choices remain unresolved and existing progression is never reduced', () => {
    const save = { DoctrineUnlockedUpgrades: [], UnlockedUpgrades: [110, 111], CultTraits: [],
        Doctrine_Afterlife_Level: 4 };
    assert.equal(selectedDoctrine(doctrineCategories[0].pairs[1], save), 'conflict');
    const before = JSON.stringify(save);
    synchronizeExistingDoctrines(save);
    assert.equal(JSON.stringify(save), before);
    setDoctrine(save, doctrineCategories[0].pairs[1], 32);
    assert.deepEqual(save.UnlockedUpgrades, [110]);
    assert.equal(save.Doctrine_Afterlife_Level, 4);
});
