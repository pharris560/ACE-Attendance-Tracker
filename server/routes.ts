import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertApiKeySchema,
  loginSchema,
  registerSchema,
  type User,
  type UserSession 
} from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";

// Extend Express Request type to include user and session
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    sessionToken?: string;
  }
}

interface AuthenticatedRequest extends Request {
  user?: User;
  session: Request['session'] & { userId?: string; sessionToken?: string };
}

interface ApiKeyRequest extends Request {
  apiKey?: any;
  user?: User;
}

// Authentication middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.session.userId || !authReq.session.sessionToken) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Verify session is still valid
  const session = await storage.getSession(authReq.session.sessionToken);
  if (!session) {
    authReq.session.userId = undefined;
    authReq.session.sessionToken = undefined;
    return res.status(401).json({ error: "Session expired" });
  }

  // Get user data
  const user = await storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  authReq.user = user;
  next();
}

// API Key verification middleware for external requests
async function verifyApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKeyReq = req as ApiKeyRequest;
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: "API key required" });
  }

  const validKey = await storage.verifyApiKey(apiKey);
  if (!validKey) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Get user associated with the API key
  const user = await storage.getUser(validKey.userId);
  if (!user) {
    return res.status(401).json({ error: "API key user not found" });
  }

  apiKeyReq.apiKey = validKey;
  apiKeyReq.user = user;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  
  // POST /api/auth/register - Register new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      
      // Don't return password in response
      const { password: _, ...userResponse } = user;
      res.status(201).json({ user: userResponse });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // POST /api/auth/login - Login user
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.verifyUserPassword(
        validatedData.username, 
        validatedData.password
      );
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Create session
      const sessionToken = randomBytes(48).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const session = await storage.createSession({
        userId: user.id,
        sessionToken,
        expiresAt,
      });
      
      // Store session in request session
      req.session.userId = user.id;
      req.session.sessionToken = sessionToken;
      
      // Don't return password in response
      const { password: _, ...userResponse } = user;
      res.json({ user: userResponse, sessionToken });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      
      console.error("Error logging in user:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  // POST /api/auth/logout - Logout user
  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    
    if (authReq.session.sessionToken) {
      await storage.deleteSession(authReq.session.sessionToken);
    }
    
    authReq.session.userId = undefined;
    authReq.session.sessionToken = undefined;
    
    res.json({ success: true, message: "Logged out successfully" });
  });

  // GET /api/auth/me - Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const { password: _, ...userResponse } = authReq.user!;
    res.json({ user: userResponse });
  });

  // API Key management routes (all require authentication)
  
  // POST /api/api-keys - Create new API key
  app.post("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const validatedData = insertApiKeySchema.parse(req.body);
      
      const apiKey = await storage.createApiKey(authReq.user!.id, validatedData.name);
      
      // Return the full key once upon creation (client should save it)
      res.json(apiKey);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      
      console.error("Error creating API key:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  // GET /api/api-keys - List user's API keys (with masked keys for security)
  app.get("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const apiKeys = await storage.getApiKeysByUserId(authReq.user!.id);
      
      res.json(apiKeys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  // DELETE /api/api-keys/:id - Revoke/delete API key
  app.delete("/api/api-keys/:id", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      
      const success = await storage.deleteApiKey(id, authReq.user!.id);
      if (!success) {
        return res.status(404).json({ error: "API key not found or access denied" });
      }
      
      res.json({ success: true, message: "API key deleted successfully" });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  // PUT /api/api-keys/:id/toggle - Toggle API key active status
  app.put("/api/api-keys/:id/toggle", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ error: "isActive must be a boolean" });
      }
      
      const success = await storage.toggleApiKeyActive(id, isActive, authReq.user!.id);
      if (!success) {
        return res.status(404).json({ error: "API key not found or access denied" });
      }
      
      res.json({ success: true, message: "API key status updated successfully" });
    } catch (error) {
      console.error("Error updating API key status:", error);
      res.status(500).json({ error: "Failed to update API key status" });
    }
  });

  // External API routes (protected by API key)
  
  // POST /api/verify-key - Verify API key (for external use)
  app.post("/api/verify-key", verifyApiKey, async (req, res) => {
    const apiKeyReq = req as ApiKeyRequest;
    
    res.json({ 
      valid: true, 
      user: {
        id: apiKeyReq.user!.id,
        username: apiKeyReq.user!.username
      },
      keyId: apiKeyReq.apiKey!.id
    });
  });
  
  // Example protected external endpoint
  app.get("/api/external/user-data", verifyApiKey, async (req, res) => {
    const apiKeyReq = req as ApiKeyRequest;
    
    // This would be your actual external API logic
    res.json({ 
      message: "Access granted",
      user: {
        id: apiKeyReq.user!.id,
        username: apiKeyReq.user!.username
      },
      timestamp: new Date().toISOString()
    });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
