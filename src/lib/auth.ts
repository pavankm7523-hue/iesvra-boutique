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

// WARNING: Hashing passwords client-side is a partial mitigation only (prevents casual localStorage inspection).
// It does NOT prevent an attacker with devtools access from authenticating by replaying the stored session or hash directly.
// True security requires a server-side authentication layer where credentials are valid and verified in a backend database.
export function hashPassword(password: string): string {
  function rotateRight(n: number, x: number) {
    return (x >>> n) | (x << (32 - n));
  }
  
  const words: number[] = [];
  const ascii = password;
  const asciiLength = ascii.length;
  for (let i = 0; i < asciiLength; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  
  const totalBits = asciiLength * 8;
  words[totalBits >> 5] |= 0x80 << (24 - (totalBits % 32));
  words[(((totalBits + 64) >>> 9) << 4) + 15] = totalBits;
  
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  
  const w = new Array(64);
  const wordsLength = words.length;
  for (let i = 0; i < wordsLength; i += 16) {
    for (let j = 0; j < 16; j++) {
      w[j] = words[i + j] || 0;
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rotateRight(7, w[j - 15]) ^ rotateRight(18, w[j - 15]) ^ (w[j - 15] >>> 3);
      const s1 = rotateRight(17, w[j - 2]) ^ rotateRight(19, w[j - 2]) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }
    
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    
    for (let j = 0; j < 64; j++) {
      const s1 = rotateRight(6, e) ^ rotateRight(11, e) ^ rotateRight(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
      const s0 = rotateRight(2, a) ^ rotateRight(13, a) ^ rotateRight(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;
      
      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }
  
  const hash = [h0, h1, h2, h3, h4, h5, h6, h7];
  return hash.map(h => {
    let hex = (h >>> 0).toString(16);
    while (hex.length < 8) hex = "0" + hex;
    return hex;
  }).join("");
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
    passwordHash: hashPassword(password),
    role: 'user'
  });
  saveRegisteredUsers(users);
  return true;
}

export function validateUserCredentials(email: string, password: string): { success: boolean; name?: string; role?: 'user' | 'admin'; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === DEFAULT_ADMIN_EMAIL) {
    const adminPassword = getAdminPassword();
    const incomingHash = hashPassword(password);
    if (password === adminPassword || incomingHash === adminPassword) {
      // Upgrade plaintext admin password to hashed version on first successful login
      if (password === adminPassword) {
        saveAdminPassword(incomingHash);
      }
      return { success: true, name: "IESVRA Admin", role: "admin" };
    }
    return { success: false, error: "Incorrect password for system administrator." };
  }

  const users = getRegisteredUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
  if (userIndex === -1) {
    return { success: false, error: "Email address not found. Please sign up." };
  }
  const user = users[userIndex];
  const incomingHash = hashPassword(password);
  
  if (user.passwordHash !== password && user.passwordHash !== incomingHash) {
    return { success: false, error: "Incorrect password. Please try again." };
  }
  
  // Upgrade legacy plaintext password to hashed format and write back to storage on first successful login
  if (user.passwordHash === password) {
    user.passwordHash = incomingHash;
    saveRegisteredUsers(users);
  }
  
  return { success: true, name: user.name, role: user.role };
}

export function updateUserPassword(email: string, password: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === DEFAULT_ADMIN_EMAIL) {
    saveAdminPassword(hashPassword(password));
    return true;
  }

  const users = getRegisteredUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
  if (userIndex === -1) return false;
  users[userIndex].passwordHash = hashPassword(password);
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
