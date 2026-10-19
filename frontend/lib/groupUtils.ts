function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export const generateDefaultGroupCover = (groupName?: string): string => {
  const name = (groupName || 'Nhóm VnNet').trim() || 'Nhóm VnNet';
  const displayName = name.length > 35 ? name.slice(0, 32) + '...' : name;
  const safeTitle = escapeXml(displayName);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="40%" stop-color="#312e81" />
        <stop offset="75%" stop-color="#4338ca" />
        <stop offset="100%" stop-color="#3730a3" />
      </linearGradient>
      <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#818cf8" />
        <stop offset="100%" stop-color="#c084fc" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="rgba(129, 140, 248, 0.25)" />
        <stop offset="100%" stop-color="rgba(129, 140, 248, 0)" />
      </radialGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1200" height="400" fill="url(#bgGrad)" />
    <rect width="1200" height="400" fill="url(#glow)" />
    <rect width="1200" height="400" fill="url(#grid)" />
    <circle cx="1100" cy="80" r="220" fill="rgba(192, 132, 252, 0.08)" />
    <circle cx="120" cy="320" r="180" fill="rgba(99, 102, 241, 0.12)" />
    
    <!-- Top badge -->
    <rect x="520" y="90" width="160" height="34" rx="17" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" />
    <text x="600" y="112" text-anchor="middle" dominant-baseline="middle" fill="#c7d2fe" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="1.5">
      👥 CỘNG ĐỒNG
    </text>

    <!-- Group Name -->
    <text x="600" y="200" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="52" font-weight="900" letter-spacing="0.5">
      ${safeTitle}
    </text>

    <!-- Decorative divider -->
    <rect x="540" y="245" width="120" height="3" rx="1.5" fill="url(#accentGrad)" />

    <!-- Subtitle -->
    <text x="600" y="285" text-anchor="middle" dominant-baseline="middle" fill="rgba(224, 231, 255, 0.85)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="500" letter-spacing="0.5">
      Không gian kết nối &amp; chia sẻ trên VnNet
    </text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const DEFAULT_GROUP_COVER = generateDefaultGroupCover('Nhóm VnNet');

export const isDefaultGroupCover = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  if (url.includes('photo-1518605368461-1e1e111d4187') || url.includes('photo-1522071820081-009f0129c71c')) return true;
  if (url.startsWith('data:image/svg+xml')) return true;
  return false;
};

export const getValidGroupCover = (url?: string | null, groupName?: string): string => {
  if (isDefaultGroupCover(url)) {
    return generateDefaultGroupCover(groupName);
  }
  return url!;
};

export const handleGroupImageError = (
  e: React.SyntheticEvent<HTMLImageElement>,
  groupName?: string
) => {
  const target = e.currentTarget;
  const fallback = generateDefaultGroupCover(groupName);
  if (target.src !== fallback) {
    target.src = fallback;
  }
};
