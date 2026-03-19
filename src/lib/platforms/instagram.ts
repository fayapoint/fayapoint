import { BasePlatformAPI, type PlatformAccount, type PlatformMetrics, type PlatformPost } from './base';

const BASE_URL = 'https://graph.instagram.com/v21.0';

export class InstagramAPI extends BasePlatformAPI {
  constructor(account: PlatformAccount) {
    super(account);
  }

  async getMetrics(): Promise<PlatformMetrics> {
    const token = this.getAccessToken();
    const data = await this.fetchJson<any>(
      `${BASE_URL}/me?fields=followers_count,follows_count,media_count&access_token=${token}`
    );
    return {
      followers: data.followers_count || 0,
      following: data.follows_count || 0,
      posts: data.media_count || 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  async getRecentPosts(limit = 25): Promise<PlatformPost[]> {
    const token = this.getAccessToken();
    const data = await this.fetchJson<any>(
      `${BASE_URL}/me/media?fields=id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count&limit=${limit}&access_token=${token}`
    );
    return (data.data || []).map((p: any) => ({
      id: p.id,
      type: p.media_type,
      url: p.media_url || '',
      permalink: p.permalink || '',
      caption: p.caption,
      timestamp: p.timestamp,
      likes: p.like_count || 0,
      comments: p.comments_count || 0,
    }));
  }

  async getInsights(period: 'day' | 'week' | 'month' = 'day') {
    const token = this.getAccessToken();
    return this.fetchJson<any>(
      `${BASE_URL}/me/insights?metric=impressions,reach,profile_views&period=${period}&access_token=${token}`
    );
  }
}
