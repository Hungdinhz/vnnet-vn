export const DEFAULT_GROUP_COVER = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200";

export const getValidGroupCover = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || url.trim() === '' || url.includes("photo-1518605368461-1e1e111d4187")) {
    return DEFAULT_GROUP_COVER;
  }
  return url;
};

export const handleGroupImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.currentTarget;
  if (target.src !== DEFAULT_GROUP_COVER) {
    target.src = DEFAULT_GROUP_COVER;
  }
};
