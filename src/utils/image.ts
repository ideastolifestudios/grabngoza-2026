/**
 * Helper to automatically inject Cloudinary optimization parameters
 * (f_auto, q_auto, width scaling) into Cloudinary image URLs.
 */
export function optimizeCloudinaryUrl(url: string | undefined | null, width?: number): string {
  if (!url) return '';
  if (typeof url !== 'string') return '';

  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  // Avoid double injection
  if (url.includes('f_auto') || url.includes('q_auto')) {
    return url;
  }

  const transformParams = ['f_auto', 'q_auto'];
  if (width && width > 0) {
    transformParams.push(`w_${width}`);
    transformParams.push('c_limit');
  }

  const transformString = transformParams.join(',');
  return url.replace('/upload/', `/upload/${transformString}/`);
}
