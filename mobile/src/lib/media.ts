import { File } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export type MediaPermission = {
  status: MediaLibrary.PermissionStatus;
  granted: boolean;
  canAskAgain: boolean;
  accessPrivileges?: 'all' | 'limited' | 'none';
};

export async function getMediaPermission(): Promise<MediaPermission> {
  const res = await MediaLibrary.getPermissionsAsync(false);
  return {
    status: res.status,
    granted: res.granted,
    canAskAgain: res.canAskAgain,
    accessPrivileges: res.accessPrivileges,
  };
}

export async function requestMediaPermission(): Promise<MediaPermission> {
  const res = await MediaLibrary.requestPermissionsAsync(false);
  return {
    status: res.status,
    granted: res.granted,
    canAskAgain: res.canAskAgain,
    accessPrivileges: res.accessPrivileges,
  };
}

export async function presentLimitedLibraryPickerIfAvailable(): Promise<void> {
  try {
    await MediaLibrary.presentPermissionsPickerAsync();
  } catch {
    // no-op
  }
}

export async function fetchOldestAsset(): Promise<MediaLibrary.Asset | null> {
  const page = await MediaLibrary.getAssetsAsync({
    first: 1,
    sortBy: [['creationTime', true]],
    mediaType: [MediaLibrary.MediaType.photo],
  });
  return page.assets[0] ?? null;
}

/**
 * On-disk size of a library asset in bytes, or null when it can't be measured
 * (e.g. an iCloud-only original that isn't downloaded). Never hits the network.
 */
export async function getAssetFileSize(assetId: string): Promise<number | null> {
  const info = await MediaLibrary.getAssetInfoAsync(assetId, { shouldDownloadFromNetwork: false });
  if (!info.localUri) return null;
  const size = new File(info.localUri).size;
  return size > 0 ? size : null;
}
