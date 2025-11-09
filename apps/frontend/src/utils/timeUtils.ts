/**
 * Format time in milliseconds to a readable format
 * @param ms - Time in milliseconds
 * @returns Formatted time string (e.g., "5:30", "1:23:45")
 */
export const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format duration in milliseconds to a human-readable format
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string (e.g., "5 minutes", "1 hour 30 minutes")
 */
export const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
    const minuteText = minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : '';
    return hourText + minuteText;
  }
  
  return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
};

/**
 * Convert minutes to milliseconds
 * @param minutes - Number of minutes
 * @returns Milliseconds
 */
export const minutesToMs = (minutes: number): number => {
  return minutes * 60 * 1000;
};

/**
 * Convert milliseconds to minutes
 * @param ms - Milliseconds
 * @returns Number of minutes
 */
export const msToMinutes = (ms: number): number => {
  return Math.floor(ms / 60000);
};

/**
 * Get relative time from now
 * @param timestamp - Timestamp in milliseconds
 * @returns Relative time string (e.g., "2 minutes ago", "in 5 minutes")
 */
export const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const absDiff = Math.abs(diff);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absDiff < minute) {
    return 'just now';
  } else if (absDiff < hour) {
    const minutes = Math.floor(absDiff / minute);
    const text = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    return diff < 0 ? `in ${text}` : `${text} ago`;
  } else if (absDiff < day) {
    const hours = Math.floor(absDiff / hour);
    const text = `${hours} hour${hours !== 1 ? 's' : ''}`;
    return diff < 0 ? `in ${text}` : `${text} ago`;
  } else {
    const days = Math.floor(absDiff / day);
    const text = `${days} day${days !== 1 ? 's' : ''}`;
    return diff < 0 ? `in ${text}` : `${text} ago`;
  }
};