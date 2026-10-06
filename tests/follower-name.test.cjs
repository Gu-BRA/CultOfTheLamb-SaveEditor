const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const sourcePath = path.resolve(__dirname, '../utils/follower-name.ts');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const loaded = new Module(sourcePath, module);
loaded.filename = sourcePath;
loaded.paths = module.paths;
loaded._compile(compiled, sourcePath);
const { generateFollowerName } = loaded.exports;

test('generates a game-style name without requiring a typed name', () => {
    const values = [0.5, 0.9, 0.9];
    assert.equal(generateFollowerName([], () => values.shift()), 'Haon');
});

test('optionally includes a middle fragment and avoids existing names', () => {
    const values = [0.5, 0.1, 0.2, 0.9, 0.5, 0.9, 0.9, 0.99, 0.9, 0];
    const random = () => values.shift();
    assert.equal(generateFollowerName(['Hagreon', 'haon'], random), 'Anar');
});
