export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    // Livestream: youtube.com/live/VIDEO_ID (with or without ?si= or other params)
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    // Standard URL: youtube.com/watch?v=VIDEO_ID (with or without additional params like &list=, &t=)
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Short share URL: youtu.be/VIDEO_ID (with or without ?si= or other params)
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Embed URL: youtube.com/embed/VIDEO_ID
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // Just the ID
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const getYouTubeThumbnail = (videoId: string): string =>
  `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

export const formatPct = (value: number): string =>
  `${(value * 100).toFixed(1)}%`;
