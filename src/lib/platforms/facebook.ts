import { BasePlatformAPI, type PlatformAccount, type PlatformMetrics, type PlatformPost } from './base';

const BASE_URL = 'https://graph.facebook.com/v21.0';

export class FacebookAPI extends BasePlatformAPI {
  constructor(account: PlatformAccount) {
    super(account);
  }

  async getMetrics(): Promise<PlatformMetrics> {
    const token = this.getAccessToken();
    const data = await this.fetchJson<any>(
      `${BASE_URL}/${this.account.platformUserId}?fields=followers_count,fan_count&access_token=${token}`
    );
    return {
      followers: data.followers_count || data.fan_count || 0,
      following: 0,
      posts: 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  async getRecentPosts(limit = 25): Promise<PlatformPost[]> {
    const token = this.getAccessToken();
    const data = await this.fetchJson<any>(
      `${BASE_URL}/${this.account.platformUserId}/posts?fields=id,message,created_time,permalink_url,likes.summary(true),comments.summary(true),shares&limit=${limit}&access_token=${token}`
    );
    return (data.data || []).map((p: any) => ({
      id: p.id,
      type: 'post',
      url: '',
      permalink: p.permalink_url || '',
      caption: p.message,
      timestamp: p.created_time,
      likes: p.likes?.summary?.total_count || 0,
      comments: p.comments?.summary?.total_count || 0,
      shares: p.shares?.count || 0,
    }));
  }
}
