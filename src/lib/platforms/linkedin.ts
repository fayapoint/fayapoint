import { BasePlatformAPI, type PlatformAccount, type PlatformMetrics, type PlatformPost } from './base';

const BASE_URL = 'https://api.linkedin.com/v2';

export class LinkedInAPI extends BasePlatformAPI {
  constructor(account: PlatformAccount) {
    super(account);
  }

  async getMetrics(): Promise<PlatformMetrics> {
    const token = this.getAccessToken();
    const data = await this.fetchJson<any>(
      `${BASE_URL}/me?projection=(id,firstName,lastName)`,
      { headers: this.getHeaders(token) }
    );
    // LinkedIn API v2 requires separate calls for follower counts
    return {
      followers: 0,
      following: 0,
      posts: 0,
      engagementRate: 0,
      reach: 0,
      impressions: 0,
    };
  }

  async getRecentPosts(limit = 25): Promise<PlatformPost[]> {
    // LinkedIn API for posts requires organization access
    return [];
  }
}
