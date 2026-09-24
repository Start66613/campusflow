export const periodStarts = ['08:00', '08:55', '10:10', '11:05', '14:00', '14:55', '16:10', '17:05', '19:00', '19:55', '20:50', '21:45'];
export const periodEnds = ['08:45', '09:40', '10:55', '11:50', '14:45', '15:40', '16:55', '17:50', '19:45', '20:40', '21:35', '22:30'];

export function parseCourseWeeks(input: string): number[] {
  const normalized = input.trim().replace(/，|、|；|;/g, ',');
  if (!normalized) throw new Error('请填写上课周次，例如 1-18 或 1,3,5。');
  const result = new Set<number>();
  for (const part of normalized.split(',').map((value) => value.trim())) {
    const match = part.match(/^(\d{1,2})(?:\s*[-~至]\s*(\d{1,2}))?(单|双)?$/);
    if (!match) throw new Error(`周次“${part}”格式不正确。`);
    const first = Number(match[1]);
    const last = Number(match[2] ?? match[1]);
    if (first < 1 || last > 30 || last < first) throw new Error('周次必须在 1–30 周之间，且结束周不能早于开始周。');
    for (let week = first; week <= last; week += 1) {
      if (!match[3] || (match[3] === '单' ? week % 2 === 1 : week % 2 === 0)) result.add(week);
    }
  }
  if (!result.size) throw new Error('选择的周次为空。');
  return [...result].sort((a, b) => a - b);
}
