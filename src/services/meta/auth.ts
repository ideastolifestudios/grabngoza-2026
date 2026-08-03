import axios from 'axios';

export class MetaAuthService {
  private accessToken = process.env.META_ACCESS_TOKEN || process.env.META_TOKEN || '';

  getAccessToken(): string {
    return this.accessToken;
  }

  async validateToken(): Promise<boolean> {
    if (!this.accessToken) {
      return false;
    }
    try {
      const response = await axios.get('https://graph.instagram.com/me', {
        params: { access_token: this.accessToken },
      });
      return !!response.data;
    } catch {
      return false;
    }
  }
}
