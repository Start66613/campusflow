import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

function load(file, dependencies = {}) {
  const source = readFileSync(join(process.cwd(), file), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compiled)((name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
    return dependencies[name];
  }, module, module.exports);
  return module.exports;
}

const grades = load('src/grades.ts');
const importer = load('src/school-importer.ts', {
  './grades': grades,
  './theme': { courseColors: ['#5B67F1'] },
});

const grade = (course, code, nature = '') => ({ kcmc: course, kch: code, cj: '86', xf: '3', jd: '3.7', kcxzmc: nature, xnm: '2026', xqm: '3' });
const course = (name, code, nature) => ({ kcmc: name, kch: code, kcxzmc: nature });

test('classifies explicit school nature without guessing from course names', () => {
  assert.equal(grades.classifyGradeNature('专业必修'), 'required');
  assert.equal(grades.classifyGradeNature('跨学科选修'), 'elective');
  assert.equal(grades.classifyGradeNature('专业必修 / 选修'), 'unknown');
  assert.equal(grades.classifyGradeNature('数据结构'), 'unknown');
});

test('old imported grades recover from explicit nature without overriding manual corrections', () => {
  const oldGrade = { course: '线性代数', category: 'unknown', courseNature: '专业必修' };
  assert.equal(grades.gradeCategory(oldGrade), 'required');
  assert.equal(grades.gradeCategory({ ...oldGrade, category: 'elective', categoryManual: true }), 'elective');
});

test('uses grade record first, then a matching official course code', () => {
  const results = importer.parseZfGradeRows([
    grade('线性代数', 'A1', '公共必修'),
    grade('数据结构 II', 'A2'),
  ], '测试学期', [
    course('线性代数', 'A1', '专业选修'),
    course('数据结构', 'A2', '专业必修'),
  ], { xnm: '2026', xqm: '3' });
  assert.deepEqual(results.map((item) => [item.category, item.categorySource]), [
    ['required', 'school-grade'],
    ['required', 'school-course'],
  ]);
});

test('exact-name fallback requires unanimous official evidence', () => {
  const results = importer.parseZfGradeRows([
    grade('大学英语', ''),
    grade('计算机基础', ''),
    grade('高等数学', ''),
  ], '测试学期', [
    course('大学英语', 'E1', '公共必修'),
    course('计算机基础', 'C1', '专业必修'),
    course('计算机基础', 'C2', '专业选修'),
  ], { xnm: '2026', xqm: '3' });
  assert.deepEqual(results.map((item) => item.category), ['required', 'unknown', 'unknown']);
});

test('same course name from another semester is not enough to classify', () => {
  const olderGrade = { ...grade('大学英语', ''), xnm: '2025', xqm: '12' };
  const results = importer.parseZfGradeRows([olderGrade], '测试学期', [course('大学英语', 'E1', '公共必修')], { xnm: '2026', xqm: '3' });
  assert.equal(results[0].category, 'unknown');
});

test('conflicting grade labels remain unknown even when timetable disagrees', () => {
  const results = importer.parseZfGradeRows([grade('课程甲', 'A1', '必修 / 选修')], '测试学期', [course('课程甲', 'A1', '必修')]);
  assert.equal(results[0].category, 'unknown');
});
