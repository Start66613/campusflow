import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export async function pickPersistentImage(kind: 'avatar' | 'background' | 'course'): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('请允许访问相册后重试。');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: kind === 'avatar',
    aspect: kind === 'avatar' ? [1, 1] : undefined,
    quality: 0.82,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (Platform.OS === 'web') return asset.uri;
  const extension = asset.mimeType === 'image/png' ? 'png'
    : asset.mimeType === 'image/webp' ? 'webp'
      : asset.mimeType === 'image/heic' ? 'heic' : 'jpg';
  const destination = new File(Paths.document, `campusflow-${kind}-${Date.now()}.${extension}`);
  await new File(asset.uri).copy(destination);
  return destination.uri;
}
