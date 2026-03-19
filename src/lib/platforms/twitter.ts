import { BasePlatformAPI, type PlatformAccount, type PlatformMetrics, type PlatformPost } from './base';

const BASE_URL = 'https://api.twitter.com/2';

export class TwitterAPI extends BasePlatformAPI {
  constructor(account: PlatformAccount) {
    super(account);
  }

  async getMetrics(): Promise<PlatformMetrics> {
    const token = this.getAccessToken();
    const data = await this.fetchJson<any>(
      `${BASE_URL}/users/${this.account.platformUserId}?user.fields=public_metrics`,
      { headers: this.getHeaders(token) }
    );
    const metrics = data.data?.public_metrics || {};
    return {
      followers: metrics.followers_count || 0,
      following: metrics.following_count || 0,
      posts: metrics.tweet_count || 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  async getRecentPosts(limit = 25): Promise<PlatformPost[]> {
    const token = this.getAccessToken();
    const data = await this.fetchJson<any>(
      `${BASE_URL}/users/${this.account.platformUserId}/tweets?max_results=${Math.min(limit, 100)}&tweet.fields=created_at,public_metrics&expansions=attachments.media_keys`,
      { headers: this.getHeaders(token) }
    );
    return (data.data || []).map((t: any) => ({
      id: t.id,
      type: 'tweet',
      url: '',
      permalink: `https://twitter.com/${this.account.username}/status/${t.id}`,
      caption: t.text,
      timestamp: t.created_at,
      likes: t.public_metrics?.like_count || 0,
      comments: t.public_metrics?.reply_count || 0,
      shares: t.public_metrics?.retweet_count || 0,
      reach: t.public_metrics?.impression_count || 0,
    }));
  }
}
