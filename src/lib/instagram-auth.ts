export function getInstagramLoginUrl(): string {
  const APP_ID = '1059095669809960';
  const REDIRECT_URI = process.env.NEXT_PUBLIC_SITE_URL 
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` 
    : 'https://shopgrabngo.co.za/auth/callback';

  const SCOPES = [
    'instagram_basic',
    'instagram_manage_messages', 
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement'
  ].join(',');

  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES}&response_type=code`;
}
