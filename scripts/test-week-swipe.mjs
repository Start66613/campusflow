import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(join(process.cwd(), 'src/week-swipe.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
new Function('module', 'exports', compiled)(module, module.exports);
const { resolveWeekSwipe } = module.exports;

test('short swipe rebounds and a deliberate swipe changes week', () => {
  assert.equal(resolveWeekSwipe(-40, -0.2, 340, 3), 0);
  assert.equal(resolveWeekSwipe(-70, -0.2, 340, 3), 1);
  assert.equal(resolveWeekSwipe(70, 0.2, 340, 3), -1);
});

test('quick flick needs velocity in the same direction', () => {
  assert.equal(resolveWeekSwipe(-30, -0.8, 340, 3), 1);
  assert.equal(resolveWeekSwipe(-30, 0.8, 340, 3), 0);
});

test('week 1 and week 30 cannot overscroll', () => {
  assert.equal(resolveWeekSwipe(100, 1, 340, 1), 0);
  assert.equal(resolveWeekSwipe(-100, -1, 340, 30), 0);
});

test('invalid gesture values do not change week', () => {
  assert.equal(resolveWeekSwipe(Number.NaN, 1, 340, 3), 0);
  assert.equal(resolveWeekSwipe(100, Number.POSITIVE_INFINITY, 340, 3), 0);
});
