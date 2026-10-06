const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const sourcePath = path.resolve(__dirname, '../utils/new-follower.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath;
loaded.paths = module.paths;
loaded._compile(compiled, sourcePath);
const { createRandomFollower, nextUnusedFollowerId } = loaded.exports;

test('new follower gets an unused ID across living, recruited, and dead followers', () => {
    const save = {
        FollowerID: 4,
        Followers: [{ ID: 1, Name: 'Base', Relationships: [{ ID: 3 }], Traits: [9] }],
        Followers_Recruit: [{ ID: 3 }],
        Followers_Dead: [{ ID: 2 }],
    };
    const templateBefore = JSON.stringify(save.Followers[0]);
    assert.equal(nextUnusedFollowerId(save), 4);
    assert.equal(nextUnusedFollowerId({ FollowerID: 1, Followers: [{ ID: 1 }, { ID: 15 }] }), 16);

    const follower = createRandomFollower(save, 'Novo', [{ name: 'Deer', variant: ['Deer', 'Deer2'] }], [
        { id: 0, colors: [{}, {}, {}] },
    ], () => 0);

    assert.equal(follower.ID, 4);
    assert.equal(save.FollowerID, 5);
    assert.equal(follower.Name, 'Novo');
    assert.deepEqual(follower.Relationships, []);
    assert.deepEqual(follower.Traits, []);
    assert.equal(follower.TraitsSet, true);
    assert.equal(follower.XPLevel, 1);
    assert.equal(follower.Age, 1);
    assert.equal(follower.DayJoined, 1);
    assert.equal(follower.MemberDuration, 1);
    assert.equal(follower.LifeExpectancy, 100);
    assert.equal(follower.SacrificialValue, 1);
    assert.equal(follower.Outfit, 18);
    assert.equal(follower.Clothing, 0);
    assert.equal(follower.ClothingVariant, '');
    assert.equal(follower.SkinName, 'Deer');
    assert.equal(follower.SkinVariation, 0);
    assert.equal(follower.Necklace, 0);
    assert.equal(follower.Adoration, 0);
    assert.equal(follower.Faith, 100);
    assert.equal(follower.Happiness, 100);
    assert.equal(follower.Illness, 0);
    assert.equal(follower.Reeducation, 100);
    assert.equal(follower.Exhaustion, 0);
    assert.equal(follower.Rest, 100);
    assert.equal(follower.Starvation, 0);
    assert.equal(follower.Satiation, 100);
    assert.equal(JSON.stringify(save.Followers[0]), templateBefore);
});

test('new follower form selection excludes special boss and locked-color forms', () => {
    const save = { Followers: [{ ID: 1 }] };
    const skins = [
        { name: 'Boss Worm', variant: ['Boss Worm'] },
        { name: 'Locked Form', variant: ['Locked Form'] },
        { name: 'Cat', variant: ['Cat', 'Cat2'] },
    ];
    const colors = [
        { id: 0, colors: [{}] },
        { id: 1, colors: [{}], lockColor: 1 },
        { id: 2, colors: [{}, {}, {}] },
    ];
    const follower = createRandomFollower(save, 'Gato', skins, colors, () => 0.99);
    assert.equal(follower.SkinCharacter, 2);
    assert.equal(follower.SkinName, 'Cat2');
    assert.equal(follower.SkinColour, 2);
});
