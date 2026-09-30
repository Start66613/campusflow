import assert from 'node:assert/strict';
import test from 'node:test';
import babel from '@babel/core';

// Metro can bundle a worklet that later crashes on-device when its closure
// contains a React element or navigation state. Inspect Babel's actual capture
// list instead of relying on a TypeScript-only check.
for (const file of ['components/segmented-control.tsx', 'app/(tabs)/_layout.tsx']) {
  test(`${file} worklets do not capture React or navigation objects`, () => {
    const code = babel.transformFileSync(file, {
      presets: ['babel-preset-expo'],
      envName: 'production',
    })?.code ?? '';
    const closures = [...code.matchAll(/__closure=\{([^}]*)\}/g)].map((match) => match[1]);
    assert.ok(closures.length > 0, 'Expected Babel to transform the worklets');
    for (const closure of closures) {
      assert.doesNotMatch(closure, /\b(items|state|navigation|routes|icon)\b/);
    }
  });
}
