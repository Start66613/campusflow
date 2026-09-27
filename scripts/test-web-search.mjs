import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(join(process.cwd(), 'src/web-search.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function loadWithResponses(responses) {
  const calls = [];
  const module = { exports: {} };
  const fetch = async (url, options) => {
    calls.push({ url, options });
    const payload = responses.shift();
    assert.ok(payload, 'unexpected extra request');
    return { ok: payload.ok ?? true, status: payload.status ?? 200, json: async () => payload.body };
  };
  new Function('require', 'module', 'exports', 'fetch', compiled)(
    () => ({ getAIConfig: async () => ({ apiKey: 'test-key', model: 'deepseek-flash' }) }), module, module.exports, fetch,
  );
  return { researchWeb: module.exports.researchWeb, calls };
}

test('uses DeepSeek native search and preserves source citations', async () => {
  const { researchWeb, calls } = loadWithResponses([{ body: {
    stop_reason: 'end_turn', content: [
      { type: 'server_tool_use', name: 'web_search', id: 'search-1' },
      { type: 'web_search_tool_result', tool_use_id: 'search-1', content: [{ type: 'web_search_result', title: '大学公告', url: 'https://example.edu/notice', encrypted_content: 'encrypted' }] },
      { type: 'text', text: '以学校公告为准。', citations: [{ type: 'web_search_result_location', title: '大学公告', url: 'https://example.edu/notice', cited_text: '公告原文' }] },
    ],
  } }]);
  const answer = await researchWeb('今年的新政策是什么？');
  assert.equal(answer.answer, '以学校公告为准。 [1]');
  assert.deepEqual(answer.sources, [{ title: '大学公告', url: 'https://example.edu/notice', content: '公告原文' }]);
  assert.equal(calls[0].url, 'https://api.deepseek.com/anthropic/v1/messages');
  assert.equal(calls[0].options.headers['x-api-key'], 'test-key');
  assert.equal(JSON.parse(calls[0].options.body).tools[0].type, 'web_search_20250305');
});

test('does not pass off an offline model answer as a web answer', async () => {
  const { researchWeb } = loadWithResponses([{ body: { stop_reason: 'end_turn', content: [{ type: 'text', text: '未搜索的回答' }] } }]);
  await assert.rejects(researchWeb('今年的新政策是什么？'), /没有执行联网搜索/);
});

test('continues a paused search without altering encrypted results', async () => {
  const first = [{ type: 'web_search_tool_result', content: [{ type: 'web_search_result', title: '公告', url: 'https://example.edu/notice', encrypted_content: 'opaque-value' }] }];
  const { researchWeb, calls } = loadWithResponses([
    { body: { stop_reason: 'pause_turn', content: first } },
    { body: { stop_reason: 'end_turn', content: [{ type: 'text', text: '请看原文。' }] } },
  ]);
  const result = await researchWeb('最新公告');
  assert.equal(result.sources[0].url, 'https://example.edu/notice');
  assert.equal(JSON.parse(calls[1].options.body).messages[1].content[0].content[0].encrypted_content, 'opaque-value');
});

test('surfaces a search-tool error returned with HTTP 200', async () => {
  const { researchWeb } = loadWithResponses([{ body: { stop_reason: 'end_turn', content: [{ type: 'web_search_tool_result', content: { type: 'web_search_tool_result_error', error_code: 'too_many_requests' } }] } }]);
  await assert.rejects(researchWeb('最新公告'), /too_many_requests/);
});
