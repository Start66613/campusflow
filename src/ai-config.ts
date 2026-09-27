import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const DEEPSEEK_KEY = 'campusflow.ai.deepseek-key.v1';
const DEEPSEEK_MODEL = 'campusflow.ai.deepseek-model.v1';
const SEARCH_KEY = 'campusflow.ai.tavily-key.v1';

export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-flash';

export type AIConfig = {
  apiKey: string;
  model: string;
};

let webMemoryConfig: AIConfig = { apiKey: '', model: DEFAULT_DEEPSEEK_MODEL };

export async function getAIConfig(): Promise<AIConfig> {
  if (Platform.OS === 'web') return webMemoryConfig;
  const [apiKey, model] = await Promise.all([
    SecureStore.getItemAsync(DEEPSEEK_KEY),
    SecureStore.getItemAsync(DEEPSEEK_MODEL),
  ]);
  return { apiKey: apiKey ?? '', model: model || DEFAULT_DEEPSEEK_MODEL };
}

export async function saveAIConfig(config: AIConfig) {
  const normalized = {
    apiKey: config.apiKey.trim(),
    model: config.model.trim() || DEFAULT_DEEPSEEK_MODEL,
  };
  if (Platform.OS === 'web') {
    webMemoryConfig = normalized;
    return;
  }
  const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
  await Promise.all([
    SecureStore.setItemAsync(DEEPSEEK_KEY, normalized.apiKey, options),
    SecureStore.setItemAsync(DEEPSEEK_MODEL, normalized.model, options),
  ]);
}

export async function clearAIConfig() {
  if (Platform.OS === 'web') {
    webMemoryConfig = { apiKey: '', model: DEFAULT_DEEPSEEK_MODEL };
    return;
  }
  await Promise.all([
    SecureStore.deleteItemAsync(DEEPSEEK_KEY),
    SecureStore.deleteItemAsync(DEEPSEEK_MODEL),
    SecureStore.deleteItemAsync(SEARCH_KEY),
  ]);
}

export async function hasAIKey() {
  return Boolean((await getAIConfig()).apiKey);
}
