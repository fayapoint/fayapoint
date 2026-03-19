import { BasePlatformAPI, type PlatformAccount, type PlatformMetrics, type PlatformPost } from './base';

const BASE_URL = 'https://open.tiktokapis.com/v2';

export class TikTokAPI extends BasePlatformAPI {
  constructor(account: PlatformAccount) {
    super(account);
  }

  async getMetrics(): Promise<PlatformMetrics> {
    const token = this.getAccessToken();
    const data = await this.fetchJson<any>(
      `${BASE_URL}/user/info/?fields=follower_count,following_count,likes_count,video_count`,
      { headers: this.getHeaders(token) }
    );
    const user = data.data?.user || {};
    return {
      followers: user.follower_count || 0,
      following: user.following_count || 0,
      posts: user.video_count || 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  async getRecentPosts(limit = 20): Promise<PlatformPost[]> {
    const token = this.getAccessToken();
    const data = await this.fetchJson<any>(
      `${BASE_URL}/video/list/?fields=id,title,create_time,share_url,like_count,comment_count,share_count,view_count`,
      {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ max_count: limit }),
      }
    );
    return (data.data?.videos || []).map((v: any) => ({
      id: v.id,
      type: 'video',
      url: '',
      permalink: v.share_url || '',
      caption: v.title,
      timestamp: new Date(v.create_time * 1000).toISOString(),
      likes: v.like_count || 0,
      comments: v.comment_count || 0,
      shares: v.share_count || 0,
      reach: v.view_count || 0,
    }));
  }
}
