export const timeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 5) return `${diffMin} min ago`;
  if (diffMin < 10) return '5 min ago';
  if (diffMin < 15) return '10 min ago';
  if (diffMin < 20) return '15 min ago';
  if (diffMin < 25) return '20 min ago';
  if (diffMin < 30) return '25 min ago';
  if (diffMin < 60) return '30 min ago';
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
};
