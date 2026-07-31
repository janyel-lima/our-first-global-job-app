import { UserProfile } from '../types';

export const getCachedVal = <T>(key: string, backup: T): T => {
  if (typeof window === "undefined") return backup;
  try {
    const item = localStorage.getItem(key);
    if (!item) return backup;
    const parsed = JSON.parse(item);
    if (Array.isArray(backup)) {
      if (Array.isArray(parsed)) {
        return parsed as unknown as T;
      } else if (parsed && typeof parsed === "object") {
        return Object.values(parsed) as unknown as T;
      }
      return backup;
    }
    return parsed as unknown as T;
  } catch {
    return backup;
  }
};

export const getCachedAuthUser = (): any => {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem("cached_auth_user");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
};

export const getCachedUserProfile = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem("cached_user_profile");
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
  return null;
};

export const getCachedIsDemoUser = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("cached_is_demo_user") === "true";
};

export const cleanUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  if (typeof obj === "object") {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        res[key] = cleanUndefined(obj[key]);
      }
    }
    return res;
  }
  return obj;
};
