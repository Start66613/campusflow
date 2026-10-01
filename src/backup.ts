import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { hydrateStoredData } from './data-migration';
import type { AppData } from './types';

const FORMAT = 'campusflow-backup';
const MAX_BYTES = 12 * 1024 * 1024;

function objects(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item));
}

function hasText(item: Record<string, unknown>, key: string) {
  return typeof item[key] === 'string';
}

function hasFiniteNumber(item: Record<string, unknown>, key: string) {
  return typeof item[key] === 'number' && Number.isFinite(item[key]);
}

export function serializeBackup(data: AppData) {
  return JSON.stringify({ format: FORMAT, version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

export function parseBackup(source: string): AppData {
  if (source.length > MAX_BYTES) throw new Error('备份文件过大，未导入。');
  let envelope: unknown;
  try { envelope = JSON.parse(source); } catch { throw new Error('文件不是有效的 JSON 备份。'); }
  if (!envelope || typeof envelope !== 'object') throw new Error('备份格式不正确。');
  const record = envelope as Record<string, unknown>;
  if (record.format !== FORMAT || record.version !== 1 || !record.data || typeof record.data !== 'object') throw new Error('这不是 CampusFlow 备份文件。');
  const data = record.data as Record<string, unknown>;
  for (const key of ['courses', 'tasks', 'expenses', 'events', 'grades', 'attendance']) {
    if (!objects(data[key])) throw new Error(`备份中的 ${key} 记录格式不正确。`);
  }
  if (!data.settings || typeof data.settings !== 'object') throw new Error('备份缺少设置。');
  if (data.focusSessions !== undefined && !objects(data.focusSessions)) throw new Error('专注记录格式不正确。');
  const checks: Array<[string, (item: Record<string, unknown>) => boolean]> = [
    ['courses', (item) => hasText(item, 'id') && hasText(item, 'name') && hasText(item, 'teacher') && hasText(item, 'location') && hasText(item, 'startTime') && hasText(item, 'endTime') && hasText(item, 'color') && hasText(item, 'type') && hasFiniteNumber(item, 'weekday') && hasFiniteNumber(item, 'startPeriod') && hasFiniteNumber(item, 'endPeriod') && Array.isArray(item.weeks) && item.weeks.every((week) => typeof week === 'number' && Number.isFinite(week))],
    ['tasks', (item) => hasText(item, 'id') && hasText(item, 'title') && hasText(item, 'dueAt') && typeof item.completed === 'boolean'],
    ['expenses', (item) => hasText(item, 'id') && hasFiniteNumber(item, 'amount') && hasText(item, 'category') && hasText(item, 'note') && hasText(item, 'occurredAt')],
    ['events', (item) => hasText(item, 'id') && hasText(item, 'title') && hasText(item, 'startAt') && hasText(item, 'endAt')],
    ['grades', (item) => hasText(item, 'id') && hasText(item, 'course') && hasText(item, 'semester') && hasFiniteNumber(item, 'score') && hasFiniteNumber(item, 'credit') && hasFiniteNumber(item, 'gpa')],
    ['attendance', (item) => hasText(item, 'courseId') && hasText(item, 'date') && hasText(item, 'status')],
  ];
  for (const [key, check] of checks) {
    if (!(data[key] as Record<string, unknown>[]).every(check)) throw new Error(`备份中的 ${key} 记录不完整，未覆盖本机数据。`);
  }
  if (data.focusSessions && !(data.focusSessions as Record<string, unknown>[]).every((item) => hasText(item, 'id') && hasFiniteNumber(item, 'minutes') && hasText(item, 'completedAt'))) throw new Error('专注记录不完整。');
  return hydrateStoredData(data as Partial<AppData>);
}

export async function shareBackup(data: AppData) {
  if (!(await Sharing.isAvailableAsync())) throw new Error('此设备暂不支持系统文件分享。');
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `CampusFlow-backup-${stamp}.json`);
  file.create({ overwrite: true });
  file.write(serializeBackup(data));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: '保存 CampusFlow 数据备份' });
}

export async function chooseBackup(): Promise<AppData | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > MAX_BYTES) throw new Error('备份文件过大，未导入。');
  return parseBackup(await new File(asset.uri).text());
}
