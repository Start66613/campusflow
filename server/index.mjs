import { createServer } from 'node:http';

const port = Number(process.env.PORT || 8787);
const model = process.env.OPENAI_MODEL || 'gpt-5-mini';
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

const colors = ['#5B67F1', '#23A89A', '#F28A5B', '#A35BD8', '#E25574', '#4D8ED8'];

const commandSchema = {
  type: 'object', additionalProperties: false, required: ['commands'], properties: {
    commands: { type: 'array', items: { anyOf: [
      { type: 'object', additionalProperties: false, required: ['type', 'amount', 'category', 'note', 'occurredAt'], properties: { type: { type: 'string', enum: ['expense'] }, amount: { type: 'number' }, category: { type: 'string', enum: ['餐饮', '交通', '学习', '娱乐', '生活', '其他'] }, note: { type: 'string' }, occurredAt: { type: 'string' } } },
      { type: 'object', additionalProperties: false, required: ['type', 'title', 'dueAt', 'courseName'], properties: { type: { type: 'string', enum: ['task'] }, title: { type: 'string' }, dueAt: { type: 'string' }, courseName: { type: 'string' } } },
      { type: 'object', additionalProperties: false, required: ['type', 'title', 'startAt', 'endAt', 'note'], properties: { type: { type: 'string', enum: ['event'] }, title: { type: 'string' }, startAt: { type: 'string' }, endAt: { type: 'string' }, note: { type: 'string' } } },
    ] } },
  },
};

const timetableSchema = {
  type: 'object', additionalProperties: false, required: ['courses'], properties: {
    courses: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'name', 'teacher', 'location', 'weekday', 'startPeriod', 'endPeriod', 'startTime', 'endTime', 'weeks', 'color', 'type'], properties: {
      id: { type: 'string' }, name: { type: 'string' }, teacher: { type: 'string' }, location: { type: 'string' }, weekday: { type: 'integer', minimum: 1, maximum: 7 }, startPeriod: { type: 'integer' }, endPeriod: { type: 'integer' }, startTime: { type: 'string' }, endTime: { type: 'string' }, weeks: { type: 'array', items: { type: 'integer' } }, color: { type: 'string', enum: colors }, type: { type: 'string', enum: ['major', 'general', 'lab', 'elective'] },
    } } },
  },
};

function send(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 12_000_000) throw new Error('请求内容过大');
  }
  return JSON.parse(body || '{}');
}

function outputText(payload) {
  for (const item of payload.output || []) {
    if (item.type !== 'message') continue;
    const part = item.content?.find((content) => content.type === 'output_text');
    if (part?.text) return part.text;
    const refusal = item.content?.find((content) => content.type === 'refusal');
    if (refusal) throw new Error(refusal.refusal || '模型拒绝处理');
  }
  throw new Error('模型没有返回可用内容');
}

async function parseWithOpenAI(input) {
  if (!process.env.OPENAI_API_KEY) throw new Error('服务端未配置 OPENAI_API_KEY');
  const timetable = input.mode === 'timetable';
  const now = new Date().toISOString();
  const content = [{ type: 'input_text', text: timetable
    ? `识别图片中的大学课表。weekday 使用 1=周一至 7=周日；时间使用 HH:mm；无法判断的老师或地点用空字符串；给每门课分配允许的颜色。当前时间 ${now}。`
    : `把用户表达转换为日程、待办或消费记录。所有日期必须是带时区的 ISO 8601。图片模式下识别作业、考试及截止时间。当前时间 ${now}，用户时区 ${input.timezone || 'Asia/Shanghai'}。用户文字：${input.text || ''}` }];
  if (input.imageBase64) content.push({ type: 'input_image', image_url: `data:image/jpeg;base64,${input.imageBase64}` });
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, store: false, input: [{ role: 'user', content }], text: { format: { type: 'json_schema', name: timetable ? 'timetable' : 'campus_commands', strict: true, schema: timetable ? timetableSchema : commandSchema } } }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || `OpenAI API ${response.status}`);
  return JSON.parse(outputText(payload));
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204, {});
  if (request.method === 'GET' && request.url === '/health') return send(response, 200, { ok: true, model });
  try {
    if (request.method === 'POST' && request.url === '/api/parse') return send(response, 200, await parseWithOpenAI(await readJson(request)));
    if (request.method === 'POST' && request.url === '/api/school/sync') {
      if (!process.env.SCHOOL_ADAPTER_URL) return send(response, 501, { error: '尚未配置这所学校的教务适配器。请设置 SCHOOL_ADAPTER_URL。' });
      const body = await readJson(request);
      const upstream = await fetch(process.env.SCHOOL_ADAPTER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await upstream.json();
      return send(response, upstream.status, result);
    }
    return send(response, 404, { error: 'Not found' });
  } catch (error) {
    return send(response, 500, { error: error instanceof Error ? error.message : 'Internal error' });
  }
});

server.listen(port, () => console.log(`CampusFlow API listening on http://localhost:${port}`));
