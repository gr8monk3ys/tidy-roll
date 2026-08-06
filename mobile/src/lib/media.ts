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
