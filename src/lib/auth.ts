import { useState, useEffect } from "react";

export interface User {
  name: string;
  email: string;
  role: 'user' | 'admin';
}

const AUTH_KEY = "ishvara_auth";
const AUTH_EVENT = "ishvara_auth_changed";

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function loginUser(name: string, email: string, role: 'user' | 'admin' = 'user') {
  if (typeof window === "undefined") return;
  const user: User = { name, email, role };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export function logoutUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

export interface RegisteredUser {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
}

const USERS_KEY = "ishvara_registered_users";
const ADMIN_PASSWORD_KEY = "ishvara_admin_password";
const DEFAULT_ADMIN_PASSWORD = "Iesvra@3104";
const DEFAULT_ADMIN_EMAIL = "arenterprisess409@gmail.com";

export function getRegisteredUsers(): RegisteredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveRegisteredUsers(users: RegisteredUser[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getAdminPassword(): string {
  if (typeof window === "undefined") return DEFAULT_ADMIN_PASSWORD;
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export function saveAdminPassword(password: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_PASSWORD_KEY, password);
}

export function registerUserInDb(name: string, email: string, password: string): boolean {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === DEFAULT_ADMIN_EMAIL) return false;
  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return false;
  }
  users.push({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: password,
    role: 'user'
  });
  saveRegisteredUsers(users);
  return true;
}

export function validateUserCredentials(email: string, password: string): { success: boolean; name?: string; role?: 'user' | 'admin'; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === DEFAULT_ADMIN_EMAIL) {
    const adminPassword = getAdminPassword();
    if (password === adminPassword) {
      return { success: true, name: "IESVRA Admin", role: "admin" };
    }
    return { success: false, error: "Incorrect password for system administrator." };
  }

  const users = getRegisteredUsers();
  const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return { success: false, error: "Email address not found. Please sign up." };
  }
  if (user.passwordHash !== password) {
    return { success: false, error: "Incorrect password. Please try again." };
  }
  return { success: true, name: user.name, role: user.role };
}

export function updateUserPassword(email: string, password: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === DEFAULT_ADMIN_EMAIL) {
    saveAdminPassword(password);
    return true;
  }

  const users = getRegisteredUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
  if (userIndex === -1) return false;
  users[userIndex].passwordHash = password;
  saveRegisteredUsers(users);
  return true;
}

export function hasUserAccount(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === DEFAULT_ADMIN_EMAIL) return true;
  const users = getRegisteredUsers();
  return users.some(u => u.email.toLowerCase() === normalizedEmail);
}


export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(() => getCurrentUser());

  useEffect(() => {
    const handleUpdate = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener(AUTH_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(AUTH_EVENT, handleUpdate);
    };
  }, []);

  return user;
}
