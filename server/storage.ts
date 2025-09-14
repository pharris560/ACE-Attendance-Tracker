import { 
  type User, 
  type InsertUser, 
  type ApiKey, 
  type InsertApiKey,
  type UserSession,
  type InsertUserSession,
  type ApiKeyWithRawKey,
  type ApiKeyDisplay
} from "@shared/schema";
import { randomUUID, randomBytes, createHash, pbkdf2Sync } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUserPassword(username: string, password: string): Promise<User | null>;
  
  // Session operations
  createSession(session: InsertUserSession): Promise<UserSession>;
  getSession(sessionToken: string): Promise<UserSession | undefined>;
  deleteSession(sessionToken: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  
  // API Key operations
  createApiKey(userId: string, name: string): Promise<ApiKeyWithRawKey>;
  getApiKeysByUserId(userId: string): Promise<ApiKeyDisplay[]>;
  getApiKey(id: string): Promise<ApiKey | undefined>;
  verifyApiKey(key: string): Promise<ApiKey | null>;
  deleteApiKey(id: string, userId: string): Promise<boolean>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  toggleApiKeyActive(id: string, isActive: boolean, userId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private apiKeys: Map<string, ApiKey>;
  private sessions: Map<string, UserSession>;

  constructor() {
    this.users = new Map();
    this.apiKeys = new Map();
    this.sessions = new Map();
    
    // Clean up expired sessions every hour
    setInterval(() => this.deleteExpiredSessions(), 60 * 60 * 1000);
  }

  // Security utility methods
  private hashPassword(password: string): string {
    const salt = randomBytes(32);
    const hash = pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return salt.toString('hex') + ':' + hash.toString('hex');
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const hashToVerify = pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha512');
    return hash === hashToVerify.toString('hex');
  }

  private hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  private generateSecureApiKey(): string {
    return 'ak_' + randomBytes(32).toString('hex');
  }

  private generateSessionToken(): string {
    return randomBytes(48).toString('hex');
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = this.hashPassword(insertUser.password);
    const user: User = { 
      ...insertUser, 
      id, 
      password: hashedPassword 
    };
    this.users.set(id, user);
    return user;
  }

  async verifyUserPassword(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = this.verifyPassword(password, user.password);
    return isValid ? user : null;
  }

  // Session operations
  async createSession(insertSession: InsertUserSession): Promise<UserSession> {
    const id = randomUUID();
    const session: UserSession = {
      id,
      ...insertSession,
      createdAt: new Date(),
    };
    this.sessions.set(insertSession.sessionToken, session);
    return session;
  }

  async getSession(sessionToken: string): Promise<UserSession | undefined> {
    const session = this.sessions.get(sessionToken);
    if (!session) return undefined;
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionToken);
      return undefined;
    }
    
    return session;
  }

  async deleteSession(sessionToken: string): Promise<void> {
    this.sessions.delete(sessionToken);
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date();
    const entries = Array.from(this.sessions.entries());
    for (const [token, session] of entries) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
      }
    }
  }

  // API Key operations
  async createApiKey(userId: string, name: string): Promise<ApiKeyWithRawKey> {
    const id = randomUUID();
    const rawKey = this.generateSecureApiKey();
    const keyHash = this.hashApiKey(rawKey);
    const keyPrefix = rawKey.substring(0, 12); // ak_12345678
    const now = new Date();
    
    const apiKey: ApiKey = {
      id,
      name,
      keyHash,
      keyPrefix,
      userId,
      createdAt: now,
      lastUsedAt: null,
      isActive: true,
    };
    
    this.apiKeys.set(id, apiKey);
    
    // Return the raw key only once during creation
    return {
      ...apiKey,
      key: rawKey
    };
  }

  async getApiKeysByUserId(userId: string): Promise<ApiKeyDisplay[]> {
    const apiKeys = Array.from(this.apiKeys.values()).filter(
      (apiKey) => apiKey.userId === userId
    );
    
    // Return keys with masked display format
    return apiKeys.map(key => ({
      ...key,
      maskedKey: `${key.keyPrefix}${'*'.repeat(52)}`
    }));
  }

  async getApiKey(id: string): Promise<ApiKey | undefined> {
    return this.apiKeys.get(id);
  }

  async verifyApiKey(key: string): Promise<ApiKey | null> {
    const keyHash = this.hashApiKey(key);
    const apiKey = Array.from(this.apiKeys.values()).find(
      (apiKey) => apiKey.keyHash === keyHash && apiKey.isActive
    );
    
    if (apiKey) {
      // Update last used timestamp
      await this.updateApiKeyLastUsed(apiKey.id);
      return apiKey;
    }
    
    return null;
  }

  async deleteApiKey(id: string, userId: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey || apiKey.userId !== userId) {
      return false; // Not found or not owned by user
    }
    
    this.apiKeys.delete(id);
    return true;
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    const apiKey = this.apiKeys.get(id);
    if (apiKey) {
      const updatedApiKey: ApiKey = {
        ...apiKey,
        lastUsedAt: new Date(),
      };
      this.apiKeys.set(id, updatedApiKey);
    }
  }

  async toggleApiKeyActive(id: string, isActive: boolean, userId: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey || apiKey.userId !== userId) {
      return false; // Not found or not owned by user
    }
    
    const updatedApiKey: ApiKey = {
      ...apiKey,
      isActive,
    };
    this.apiKeys.set(id, updatedApiKey);
    return true;
  }
}

export const storage = new MemStorage();
