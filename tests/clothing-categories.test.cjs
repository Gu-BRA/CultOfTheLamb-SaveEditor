const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const clothing = require('../public/data/followerClothing.json');
const appearance = require('../public/data/followerClothingAppearance.json');
const categories = [
    ['Regular clothing', 13],
    ['Special outfits', 10],
    ['Cultist Pack', 2],
    ['Heretic Pack', 2],
    ['Sinful Pack', 6],
    ['Pilgrim Pack', 2],
    ['Apple Arcade', 2],
    ['Appearance only', 1],
];

test('clothing catalog groups the 38 unlockable and appearance entries by native category', () => {
    const grouped = clothing.filter(item => item.category);
    assert.equal(grouped.length, 38);
    for (const [category, count] of categories) {
        assert.equal(grouped.filter(item => item.category === category).length, count, category);
    }
    assert.ok(grouped.every(item => appearance[item.id]?.variants?.length), 'every displayed item has native appearance data');
    assert.equal(grouped.find(item => item.category === 'Appearance only').name, 'Corpo Nu');
});

test('the clothes collection retains native save switches and renders a clothes-only preview', () => {
    const page = fs.readFileSync(path.resolve(__dirname, '../pages/index.vue'), 'utf8');
    const preview = fs.readFileSync(path.resolve(__dirname, '../components/ClothingPreview.vue'), 'utf8');
    assert.match(page, /UnlockedClothing/i);
    assert.match(page, /toggleClothing\(clothing\.id, \$event\)/);
    assert.match(page, /<ClothingPreview :clothing-id="clothing\.id"/);
    assert.match(preview, /SkinName: ''/);
});
