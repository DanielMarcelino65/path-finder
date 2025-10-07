import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function speedToDelayMs(speed: number) {
  const MIN_DELAY = 5;
  const MAX_DELAY = 100;
  const t = (speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN);
  return MAX_DELAY - t * (MAX_DELAY - MIN_DELAY);
}
const SPEED_MIN = 5;
const SPEED_MAX = 100;
