import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserId(): string {
  const USER_ID_KEY = 'table_app_user_id';
  
  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
}
