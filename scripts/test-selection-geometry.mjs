import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(join(process.cwd(), 'src/selection-geometry.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
new Function('module', 'exports', compiled)(module, module.exports);
const { selectionIndex, selectionPosition, selectionTickIndex } = module.exports;

test('tab lens follows the finger between centers, then selects the nearest tab', () => {
  assert.equal(selectionPosition(45, 5, 80, 5), 0);
  assert.equal(selectionPosition(85, 5, 80, 5), 0.5);
  assert.equal(selectionPosition(125, 5, 80, 5), 1);
  assert.equal(selectionIndex(85, 5, 80, 5), 1);
});

test('the capsule clamps at both ends of narrow and wide controls', () => {
  assert.equal(selectionIndex(-100, 4, 55, 4), 0);
  assert.equal(selectionIndex(900, 4, 55, 4), 3);
  assert.equal(selectionPosition(900, 4, 95, 3), 2);
});

test('unmeasured controls never divide by zero', () => {
  assert.equal(selectionPosition(100, 4, 0, 5), 0);
  assert.equal(selectionIndex(Number.NaN, 4, 70, 5), 0);
  assert.equal(selectionIndex(100, 4, 70, 0), 0);
});

test('selection ticks have a small dead zone around boundaries', () => {
  assert.equal(selectionTickIndex(0.52, 0, 5), 0);
  assert.equal(selectionTickIndex(0.59, 0, 5), 1);
  assert.equal(selectionTickIndex(0.48, 1, 5), 1);
  assert.equal(selectionTickIndex(0.4, 1, 5), 0);
  assert.equal(selectionTickIndex(3.2, 0, 5), 3);
});
