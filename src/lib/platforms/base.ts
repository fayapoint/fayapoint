/**
 * Base platform API class for social media integrations.
 * Ported from USS, adapted to use native fetch and fayapoint-ai's SocialAccount model.
 */

export interface PlatformAccount {
  platform: string;
  platformUserId: string;
  username: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export interface PlatformMetrics {
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  reach: number;
  impressions: number;
}

export interface PlatformPost {
  id: string;
  type: string;
  url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares?: number;
  reach?: number;
}

export abstract class BasePlatformAPI {
  protected account: PlatformAccount;

  constructor(account: PlatformAccount) {
    this.account = account;
  }

  protected getAccessToken(): string {
    return this.account.accessToken || '';
  }

  protected isTokenExpired(): boolean {
    if (!this.account.tokenExpiresAt) return false;
    return new Date(this.account.tokenExpiresAt) < new Date();
  }

  protected getHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  protected async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${this.account.platform} API error ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  abstract getMetrics(): Promise<PlatformMetrics>;
  abstract getRecentPosts(limit?: number): Promise<PlatformPost[]>;
}
