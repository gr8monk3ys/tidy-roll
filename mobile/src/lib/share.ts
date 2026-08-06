import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

export class ShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShareError';
  }
}

export async function shareAssetById(assetId: string): Promise<void> {
  const info = await MediaLibrary.getAssetInfoAsync(assetId, { shouldDownloadFromNetwork: true });
  const shareUri = info.localUri ?? info.uri;

  if (!shareUri) {
    throw new ShareError('Asset has no shareable URI.');
  }
  if (shareUri.startsWith('ph://')) {
    // iOS photo library reference, not shareable as a file without a localUri.
    throw new ShareError('Asset is not available as a local file yet.');
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri);
    return;
  }

  // Fallback (web or platforms without Expo Sharing)
  await Share.share({ url: shareUri, message: shareUri });
}
