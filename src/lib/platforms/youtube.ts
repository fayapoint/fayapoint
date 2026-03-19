import { BasePlatformAPI, type PlatformAccount, type PlatformMetrics, type PlatformPost } from './base';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export class YouTubeAPI extends BasePlatformAPI {
  constructor(account: PlatformAccount) {
    super(account);
  }

  async getMetrics(): Promise<PlatformMetrics> {
    const token = this.getAccessToken();
    const data = await this.fetchJson<any>(
      `${BASE_URL}/channels?part=statistics&id=${this.account.platformUserId}&key=${process.env.YOUTUBE_API_KEY || ''}`,
      { headers: this.getHeaders(token) }
    );
    const stats = data.items?.[0]?.statistics || {};
    return {
      followers: parseInt(stats.subscriberCount) || 0,
      following: 0,
      posts: parseInt(stats.videoCount) || 0,
      engagementRate: 0,
      reach: parseInt(stats.viewCount) || 0,
      impressions: 0,
    };
  }

  async getRecentPosts(limit = 25): Promise<PlatformPost[]> {
    const token = this.getAccessToken();
    const search = await this.fetchJson<any>(
      `${BASE_URL}/search?part=snippet&channelId=${this.account.platformUserId}&order=date&maxResults=${limit}&type=video`,
      { headers: this.getHeaders(token) }
    );
    return (search.items || []).map((v: any) => ({
      id: v.id?.videoId || v.id,
      type: 'video',
      url: `https://img.youtube.com/vi/${v.id?.videoId}/hqdefault.jpg`,
      permalink: `https://youtube.com/watch?v=${v.id?.videoId}`,
      caption: v.snippet?.title,
      timestamp: v.snippet?.publishedAt,
      likes: 0,
      comments: 0,
    }));
  }
}
