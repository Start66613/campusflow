import type { Grade, GradeCategory } from './types';

// Course nature comes from the school's grade row, not from a timetable's
// broad display type. Ambiguous rows remain unclassified until confirmed.
export function classifyGradeNature(nature: string): GradeCategory {
  const value = nature.replace(/\s+/g, '');
  if (/选修|限选|任选|公选|跨学科|自主发展/.test(value)) return 'elective';
  if (/必修/.test(value)) return 'required';
  return 'unknown';
}

export function gradeCategory(grade: Grade): GradeCategory {
  return grade.category ?? classifyGradeNature(grade.courseNature ?? '');
}

// 湘潭大学本科生学籍管理规定（2017 版）第十二条的分段绩点表。
export function xtuGradePoint(score: number) {
  if (score >= 90) return 4.0;
  if (score >= 85) return 3.7;
  if (score >= 82) return 3.3;
  if (score >= 78) return 3.0;
  if (score >= 75) return 2.7;
  if (score >= 72) return 2.3;
  if (score >= 68) return 2.0;
  if (score >= 64) return 1.5;
  if (score >= 60) return 1.0;
  return 0;
}

export function summarizeGrades(grades: Grade[]) {
  const required = grades.filter((grade) => gradeCategory(grade) === 'required' && grade.credit > 0);
  const elective = grades.filter((grade) => gradeCategory(grade) === 'elective');
  const unknown = grades.filter((grade) => gradeCategory(grade) === 'unknown');
  const requiredCredits = required.reduce((sum, grade) => sum + grade.credit, 0);
  const electiveCredits = elective.reduce((sum, grade) => sum + (grade.score >= 60 ? grade.credit : 0), 0);
  const gpa = requiredCredits
    ? required.reduce((sum, grade) => sum + grade.gpa * grade.credit, 0) / requiredCredits
    : null;
  return { gpa, requiredCredits, electiveCredits, unknownCount: unknown.length };
}
