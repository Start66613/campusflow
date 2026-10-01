import type { AssistantCommand, Course, ExpenseCategory, Task } from './types';
import { getAIConfig } from './ai-config';
import { periodEnds, periodStarts } from './periods';
import { courseColors } from './theme';

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const deepSeekUrl = 'https://api.deepseek.com/chat/completions';

const commandShape = `
Return only JSON in this exact shape: {"summary":["short user-facing step",...],"commands":[...]}. "summary" must contain 1-3 concise Chinese steps describing what was recognized and checked. It is a result summary, never hidden chain-of-thought. Supported commands:
- {"type":"expense","amount":number,"category":"餐饮|交通|学习|娱乐|生活|其他","note":string,"occurredAt":ISO8601}
- {"type":"task","title":string,"dueAt":ISO8601,"courseName"?:string}
- {"type":"event","title":string,"startAt":ISO8601,"endAt":ISO8601,"note"?:string}
- {"type":"courses","courses":[{"name":string,"teacher":string,"location":string,"weekday":1-7,"startPeriod":number,"endPeriod":number,"startTime":"HH:mm","endTime":"HH:mm","weeks":number[],"color":string,"type":"major|general|lab|elective"}]}
When the user asks to add a class, lab session, or uploads a course arrangement, use the courses command. Extract each explicit class/week; never replace an existing timetable. Do not invent weekday, periods or weeks. If any essential scheduling field is missing, return no courses and explain what to clarify in summary. Never invent a due time when the image or text does not contain one; use 20:00 local time only when a date is clear. Keep Chinese titles concise.`;

export type AssistantParseResult = {
  commands: AssistantCommand[];
  usedAI: boolean;
  processSummary: string[];
};

export type AssistantContext = {
  courses: Pick<Course, 'name' | 'weekday' | 'startTime' | 'endTime'>[];
  tasks: Pick<Task, 'title' | 'dueAt' | 'completed'>[];
};

function extractJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  return JSON.parse((fenced ?? content).trim());
}

function cleanSummary(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, 48))
    .filter(Boolean)
    .slice(0, 3);
}

function validDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function sanitizeCommands(value: unknown): AssistantCommand[] {
  if (!Array.isArray(value)) return [];
  const categories: ExpenseCategory[] = ['餐饮', '交通', '学习', '娱乐', '生活', '其他'];
  return value.slice(0, 30).flatMap((raw): AssistantCommand[] => {
    if (!raw || typeof raw !== 'object') return [];
    const command = raw as Record<string, unknown>;
    if (command.type === 'courses') {
      const courses = sanitizeAICourses(command.courses);
      return courses.length ? [{ type: 'courses', courses }] : [];
    }
    if (command.type === 'expense') {
      const amount = Number(command.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return [];
      const category = categories.includes(command.category as ExpenseCategory) ? command.category as ExpenseCategory : '其他';
      return [{ type: 'expense', amount, category, note: typeof command.note === 'string' ? command.note.trim().slice(0, 120) : '', occurredAt: validDate(command.occurredAt) ? command.occurredAt : new Date().toISOString() }];
    }
    if (command.type === 'task') {
      const title = typeof command.title === 'string' ? command.title.trim().slice(0, 120) : '';
      if (!title || !validDate(command.dueAt)) return [];
      return [{ type: 'task', title, dueAt: command.dueAt, courseName: typeof command.courseName === 'string' ? command.courseName.slice(0, 80) : undefined }];
    }
    if (command.type === 'event') {
      const title = typeof command.title === 'string' ? command.title.trim().slice(0, 120) : '';
      if (!title || !validDate(command.startAt) || !validDate(command.endAt) || Date.parse(command.endAt) <= Date.parse(command.startAt)) return [];
      return [{ type: 'event', title, startAt: command.startAt, endAt: command.endAt, note: typeof command.note === 'string' ? command.note.slice(0, 200) : undefined }];
    }
    return [];
  });
}

export function sanitizeAICourses(value: unknown): Course[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 80).flatMap((raw, index) => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as Record<string, unknown>;
    const name = typeof item.name === 'string' ? item.name.trim().slice(0, 80) : '';
    const weekday = Number(item.weekday);
    const startPeriod = Number(item.startPeriod);
    const endPeriod = Number(item.endPeriod);
    const weeks = Array.isArray(item.weeks) ? [...new Set(item.weeks.map(Number).filter((week) => Number.isInteger(week) && week >= 1 && week <= 30))].sort((a, b) => a - b) : [];
    if (!name || !Number.isInteger(weekday) || weekday < 1 || weekday > 7 || !Number.isInteger(startPeriod) || !Number.isInteger(endPeriod) || startPeriod < 1 || endPeriod > 12 || endPeriod < startPeriod || weeks.length === 0) return [];
    const color = typeof item.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(item.color) ? item.color : courseColors[index % courseColors.length];
    const type = ['major', 'general', 'lab', 'elective'].includes(String(item.type)) ? item.type as Course['type'] : /实验|实训/.test(name) ? 'lab' : 'major';
    const startTime = typeof item.startTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime) ? item.startTime : periodStarts[startPeriod - 1];
    const endTime = typeof item.endTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(item.endTime) ? item.endTime : periodEnds[endPeriod - 1];
    return [{ id: `ai-course-${Date.now()}-${index}`, name, teacher: typeof item.teacher === 'string' ? item.teacher.trim().slice(0, 40) : '', location: typeof item.location === 'string' ? item.location.trim().slice(0, 60) : '', weekday, startPeriod, endPeriod, startTime, endTime, weeks, color, type }];
  });
}

async function callDeepSeek(text: string, imageBase64?: string, thinking = false, context?: AssistantContext, jiahaoMode = false) {
  const config = await getAIConfig();
  if (!config.apiKey) return null;
  const now = new Date();
  const userContent = imageBase64
    ? [
        { type: 'text', text },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
      ]
    : text;
  const contextHint = context ? `\nRelevant local context (use only to disambiguate, do not invent facts): ${JSON.stringify({
    courses: context.courses.slice(0, 40),
    openTasks: context.tasks.filter((task) => !task.completed).slice(0, 30),
  })}` : '';
  const response = await fetch(deepSeekUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: imageBase64 ? 'deepseek-flash' : config.model,
      temperature: 0.1,
      ...(thinking ? { thinking: { type: 'enabled' }, reasoning_effort: 'high' } : {}),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are CampusFlow's structured campus-life assistant. Current local time is ${now.toISOString()}, timezone ${Intl.DateTimeFormat().resolvedOptions().timeZone}. ${commandShape}${contextHint}${jiahaoMode ? ' Presentation style only: in the summary, use a restrained playful 嘉豪 tone and optionally the phrase 全体嘉豪，往里豪. Never alter any extracted command fields, student-provided course names, amounts, dates, grades or factual details for the joke.' : ''}`,
        },
        { role: 'user', content: userContent },
      ],
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `DeepSeek 请求失败（${response.status}）`);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek 没有返回可识别的内容');
  const result = extractJson(content);
  return {
    commands: sanitizeCommands(result?.commands),
    processSummary: cleanSummary(result?.summary),
  };
}

function inferCategory(text: string): ExpenseCategory {
  if (/饭|餐|奶茶|咖啡|水果|外卖/.test(text)) return '餐饮';
  if (/车|地铁|公交|打车/.test(text)) return '交通';
  if (/书|打印|文具|课程/.test(text)) return '学习';
  if (/电影|游戏|唱歌|娱乐/.test(text)) return '娱乐';
  if (/日用|洗|纸|生活/.test(text)) return '生活';
  return '其他';
}
function parseDate(text: string) {
  const now = new Date();
  const result = new Date(now);
  if (text.includes('后天')) result.setDate(result.getDate() + 2);
  else if (text.includes('明天')) result.setDate(result.getDate() + 1);
  else {
    const weekMatch = text.match(/下?(?:周|星期)([一二三四五六日天])/);
    if (weekMatch) {
      const names = '一二三四五六日';
      const target = names.indexOf(weekMatch[1].replace('天', '日')) + 1;
      const current = now.getDay() || 7;
      let offset = (target - current + 7) % 7;
      if (text.includes('下周') || offset === 0) offset += 7;
      result.setDate(result.getDate() + offset);
    }
    const dateMatch = text.match(/(\d{1,2})月(\d{1,2})[日号]?/);
    if (dateMatch) result.setMonth(Number(dateMatch[1]) - 1, Number(dateMatch[2]));
  }
  const timeMatch = text.match(/(?:上午|下午|晚上|中午)?\s*(\d{1,2})(?:[:：点时](\d{1,2})?分?)?/);
  let hour = timeMatch ? Number(timeMatch[1]) : 20;
  const minute = timeMatch?.[2] ? Number(timeMatch[2]) : 0;
  if (/(下午|晚上)/.test(text) && hour < 12) hour += 12;
  if (text.includes('中午') && hour < 11) hour += 12;
  result.setHours(hour, minute, 0, 0);
  return result;
}

export function parseLocally(text: string): AssistantCommand[] {
  const money = text.match(/(?:花了?|消费|买|吃了?)?\s*(\d+(?:\.\d+)?)\s*(?:元|块)/);
  if (money) {
    return [{
      type: 'expense', amount: Number(money[1]), category: inferCategory(text),
      note: text.replace(money[0], '').replace(/[，。,.]/g, '').trim() || '日常消费', occurredAt: new Date().toISOString(),
    }];
  }

  const start = parseDate(text);
  if (/作业|提交|交|考试|复习|背诵|待办|提醒我/.test(text)) {
    const title = text
      .replace(/提醒我|记得|添加|新建|明天|后天|下周|本周/g, '')
      .replace(/(?:上午|下午|晚上|中午)?\s*\d{1,2}(?:[:：点时]\d{0,2}分?)?/g, '')
      .replace(/[，。,.]/g, ' ').trim();
    return [{ type: 'task', title: title || '新待办', dueAt: start.toISOString() }];
  }

  const durationMatch = text.match(/(\d+(?:\.\d+)?)\s*小时/);
  const duration = durationMatch ? Number(durationMatch[1]) * 60 : 60;
  const end = new Date(start.getTime() + duration * 60_000);
  return [{ type: 'event', title: text.trim(), startAt: start.toISOString(), endAt: end.toISOString() }];
}

export async function parseAssistantInput(text: string, imageBase64?: string, thinking = false, context?: AssistantContext, jiahaoMode = false): Promise<AssistantParseResult> {
  const directResult = await callDeepSeek(text, imageBase64, thinking, context, jiahaoMode);
  if (directResult) return { commands: directResult.commands, usedAI: true, processSummary: directResult.processSummary };
  if (!apiUrl) {
    const commands = parseLocally(text);
    return { commands, usedAI: false, processSummary: jiahaoMode ? ['嘉豪识别事项', '认真核对时间与类型', '等你确认后往里豪'] : ['识别表达中的事项', '提取时间与类型', '写入对应页面'] };
  }
  const response = await fetch(`${apiUrl}/api/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, imageBase64, context, mode: imageBase64 ? 'homework' : 'assistant', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  });
  if (!response.ok) throw new Error(`AI 服务暂不可用（${response.status}）`);
  const result = await response.json();
  return {
    commands: sanitizeCommands(result.commands),
    usedAI: true,
    processSummary: cleanSummary(result.summary).length ? cleanSummary(result.summary) : ['识别事项', '校验时间', '完成写入'],
  };
}

export async function parseTimetableImage(imageBase64: string): Promise<Course[]> {
  const directResult = await callDeepSeek('识别这张大学课表。逐个读取课程名称、老师、教室、星期、节次、上课周次和时间；把结果作为 courses 命令返回。', imageBase64, true);
  if (directResult) {
    const coursesCommand = directResult.commands.find((command) => command.type === 'courses');
    if (!coursesCommand || coursesCommand.type !== 'courses') throw new Error('图片里没有识别到完整课表');
    return sanitizeAICourses(coursesCommand.courses);
  }
  if (!apiUrl) throw new Error('请先配置 EXPO_PUBLIC_API_URL，截图识别需要后端 AI 代理。');
  const response = await fetch(`${apiUrl}/api/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mode: 'timetable', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  });
  if (!response.ok) throw new Error(`课表识别失败（${response.status}）`);
  const result = await response.json();
  return sanitizeAICourses(result.courses);
}
