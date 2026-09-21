import type { AssistantCommand, Course, ExpenseCategory, Task } from './types';
import { getAIConfig } from './ai-config';

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const deepSeekUrl = 'https://api.deepseek.com/chat/completions';

const commandShape = `
Return only JSON in this exact shape: {"summary":["short user-facing step",...],"commands":[...]}. "summary" must contain 1-3 concise Chinese steps describing what was recognized and checked. It is a result summary, never hidden chain-of-thought. Supported commands:
- {"type":"expense","amount":number,"category":"椁愰ギ|浜ら€殀瀛︿範|濞变箰|鐢熸椿|鍏朵粬","note":string,"occurredAt":ISO8601}
- {"type":"task","title":string,"dueAt":ISO8601,"courseName"?:string}
- {"type":"event","title":string,"startAt":ISO8601,"endAt":ISO8601,"note"?:string}
- {"type":"courses","courses":[{"id":string,"name":string,"teacher":string,"location":string,"weekday":1-7,"startPeriod":number,"endPeriod":number,"startTime":"HH:mm","endTime":"HH:mm","weeks":number[],"color":string,"type":"major|general|lab|elective"}]}
Never invent a due time when the image or text does not contain one; use 20:00 local time only when a date is clear. Keep Chinese titles concise.`;

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

async function callDeepSeek(text: string, imageBase64?: string, thinking = false, context?: AssistantContext) {
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
      model: config.model,
      temperature: 0.1,
      ...(thinking ? { thinking: { type: 'enabled' }, reasoning_effort: 'high' } : {}),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are CampusFlow's structured campus-life assistant. Current local time is ${now.toISOString()}, timezone ${Intl.DateTimeFormat().resolvedOptions().timeZone}. ${commandShape}${contextHint}`,
        },
        { role: 'user', content: userContent },
      ],
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `DeepSeek 璇锋眰澶辫触锛?{response.status}锛塦);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek 娌℃湁杩斿洖鍙瘑鍒殑鍐呭');
  const result = extractJson(content);
  return {
    commands: Array.isArray(result?.commands) ? result.commands as AssistantCommand[] : [],
    processSummary: cleanSummary(result?.summary),
  };
}

function inferCategory(text: string): ExpenseCategory {
  if (/楗瓅椁恷濂惰尪|鍜栧暋|姘存灉|澶栧崠/.test(text)) return '椁愰ギ';
  if (/杞鍦伴搧|鍏氦|鎵撹溅/.test(text)) return '浜ら€?;
  if (/涔鎵撳嵃|鏂囧叿|璇剧▼/.test(text)) return '瀛︿範';
  if (/鐢靛奖|娓告垙|鍞辨瓕|濞变箰/.test(text)) return '濞变箰';
  if (/鏃ョ敤|娲梶绾竱鐢熸椿/.test(text)) return '鐢熸椿';
  return '鍏朵粬';
}
function parseDate(text: string) {
  const now = new Date();
  const result = new Date(now);
  if (text.includes('鍚庡ぉ')) result.setDate(result.getDate() + 2);
  else if (text.includes('鏄庡ぉ')) result.setDate(result.getDate() + 1);
  else {
    const weekMatch = text.match(/涓?(?:鍛▅鏄熸湡)([涓€浜屼笁鍥涗簲鍏棩澶)/);
    if (weekMatch) {
      const names = '涓€浜屼笁鍥涗簲鍏棩';
      const target = names.indexOf(weekMatch[1].replace('澶?, '鏃?)) + 1;
      const current = now.getDay() || 7;
      let offset = (target - current + 7) % 7;
      if (text.includes('涓嬪懆') || offset === 0) offset += 7;
      result.setDate(result.getDate() + offset);
    }
    const dateMatch = text.match(/(\d{1,2})鏈?\d{1,2})[鏃ュ彿]?/);
    if (dateMatch) result.setMonth(Number(dateMatch[1]) - 1, Number(dateMatch[2]));
  }
  const timeMatch = text.match(/(?:涓婂崍|涓嬪崍|鏅氫笂|涓崍)?\s*(\d{1,2})(?:[:锛氱偣鏃禲(\d{1,2})?鍒?)?/);
  let hour = timeMatch ? Number(timeMatch[1]) : 20;
  const minute = timeMatch?.[2] ? Number(timeMatch[2]) : 0;
  if (/(涓嬪崍|鏅氫笂)/.test(text) && hour < 12) hour += 12;
  if (text.includes('涓崍') && hour < 11) hour += 12;
  result.setHours(hour, minute, 0, 0);
  return result;
}

export function parseLocally(text: string): AssistantCommand[] {
  const money = text.match(/(?:鑺变簡?|娑堣垂|涔皘鍚冧簡?)?\s*(\d+(?:\.\d+)?)\s*(?:鍏億鍧?/);
  if (money) {
    return [{
      type: 'expense', amount: Number(money[1]), category: inferCategory(text),
      note: text.replace(money[0], '').replace(/[锛屻€?.]/g, '').trim() || '鏃ュ父娑堣垂', occurredAt: new Date().toISOString(),
    }];
  }

  const start = parseDate(text);
  if (/浣滀笟|鎻愪氦|浜鑰冭瘯|澶嶄範|鑳岃|寰呭姙|鎻愰啋鎴?.test(text)) {
    const title = text
      .replace(/鎻愰啋鎴憒璁板緱|娣诲姞|鏂板缓|鏄庡ぉ|鍚庡ぉ|涓嬪懆|鏈懆/g, '')
      .replace(/(?:涓婂崍|涓嬪崍|鏅氫笂|涓崍)?\s*\d{1,2}(?:[:锛氱偣鏃禲\d{0,2}鍒?)?/g, '')
      .replace(/[锛屻€?.]/g, ' ').trim();
    return [{ type: 'task', title: title || '鏂板緟鍔?, dueAt: start.toISOString() }];
  }

  const durationMatch = text.match(/(\d+(?:\.\d+)?)\s*灏忔椂/);
  const duration = durationMatch ? Number(durationMatch[1]) * 60 : 60;
  const end = new Date(start.getTime() + duration * 60_000);
  return [{ type: 'event', title: text.trim(), startAt: start.toISOString(), endAt: end.toISOString() }];
}

export async function parseAssistantInput(text: string, imageBase64?: string, thinking = false, context?: AssistantContext): Promise<AssistantParseResult> {
  const directResult = await callDeepSeek(text, imageBase64, thinking, context);
  if (directResult) return { commands: directResult.commands, usedAI: true, processSummary: directResult.processSummary };
  if (!apiUrl) {
    const commands = parseLocally(text);
    return { commands, usedAI: false, processSummary: ['璇嗗埆琛ㄨ揪涓殑浜嬮」', '鎻愬彇鏃堕棿涓庣被鍨?, '鍐欏叆瀵瑰簲椤甸潰'] };
  }
  const response = await fetch(`${apiUrl}/api/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, imageBase64, context, mode: imageBase64 ? 'homework' : 'assistant', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  });
  if (!response.ok) throw new Error(`AI 鏈嶅姟鏆備笉鍙敤锛?{response.status}锛塦);
  const result = await response.json();
  return {
    commands: result.commands as AssistantCommand[],
    usedAI: true,
    processSummary: cleanSummary(result.summary).length ? cleanSummary(result.summary) : ['璇嗗埆浜嬮」', '鏍￠獙鏃堕棿', '瀹屾垚鍐欏叆'],
  };
}

export async function parseTimetableImage(imageBase64: string): Promise<Course[]> {
  const directResult = await callDeepSeek('璇嗗埆杩欏紶澶у璇捐〃銆傞€愪釜璇诲彇璇剧▼鍚嶇О銆佽€佸笀銆佹暀瀹ゃ€佹槦鏈熴€佽妭娆°€佷笂璇惧懆娆″拰鏃堕棿锛涙妸缁撴灉浣滀负 courses 鍛戒护杩斿洖銆?, imageBase64, true);
  if (directResult) {
    const coursesCommand = directResult.commands.find((command) => command.type === 'courses');
    if (!coursesCommand || coursesCommand.type !== 'courses') throw new Error('鍥剧墖閲屾病鏈夎瘑鍒埌瀹屾暣璇捐〃');
    return coursesCommand.courses;
  }
  if (!apiUrl) throw new Error('璇峰厛閰嶇疆 EXPO_PUBLIC_API_URL锛屾埅鍥捐瘑鍒渶瑕佸悗绔?AI 浠ｇ悊銆?);
  const response = await fetch(`${apiUrl}/api/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mode: 'timetable', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  });
  if (!response.ok) throw new Error(`璇捐〃璇嗗埆澶辫触锛?{response.status}锛塦);
  const result = await response.json();
  return result.courses as Course[];
}
