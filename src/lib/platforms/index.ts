import type { PlatformAccount } from './base';
import { InstagramAPI } from './instagram';
import { FacebookAPI } from './facebook';
import { TwitterAPI } from './twitter';
import { LinkedInAPI } from './linkedin';
import { YouTubeAPI } from './youtube';
import { TikTokAPI } from './tiktok';

export class SocialPlatformFactory {
  static create(account: PlatformAccount) {
    switch (account.platform) {
      case 'instagram': return new InstagramAPI(account);
      case 'facebook':  return new FacebookAPI(account);
      case 'twitter':   return new TwitterAPI(account);
      case 'linkedin':  return new LinkedInAPI(account);
      case 'youtube':   return new YouTubeAPI(account);
      case 'tiktok':    return new TikTokAPI(account);
      default:
        throw new Error(`Unsupported platform: ${account.platform}`);
    }
  }
}

export { InstagramAPI } from './instagram';
export { FacebookAPI } from './facebook';
export { TwitterAPI } from './twitter';
export { LinkedInAPI } from './linkedin';
export { YouTubeAPI } from './youtube';
export { TikTokAPI } from './tiktok';
export type { PlatformAccount, PlatformMetrics, PlatformPost } from './base';
export { BasePlatformAPI } from './base';
