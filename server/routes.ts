import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertApiKeySchema,
  loginSchema,
  registerSchema,
  insertClassSchema,
  insertStudentSchema,
  insertAttendanceRecordSchema,
  markAttendanceSchema,
  bulkAttendanceSchema,
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

  // Class management routes
  
  // POST /api/classes - Create new class
  app.post("/api/classes", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const validatedData = insertClassSchema.parse(req.body);
      
      const newClass = await storage.createClass(validatedData, authReq.user!.id);
      
      res.status(201).json(newClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      
      console.error("Error creating class:", error);
      res.status(500).json({ error: "Failed to create class" });
    }
  });
  
  // GET /api/classes - List classes (public access for viewing)
  app.get("/api/classes", async (req, res) => {
    try {
      // Get all classes for public viewing (no authentication required)
      const classes = await storage.getAllClasses();
      
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });
  
  // GET /api/classes/:id - Get class details
  app.get("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const classData = await storage.getClass(id);
      
      if (!classData) {
        return res.status(404).json({ error: "Class not found" });
      }
      
      res.json(classData);
    } catch (error) {
      console.error("Error fetching class:", error);
      res.status(500).json({ error: "Failed to fetch class" });
    }
  });
  
  // PUT /api/classes/:id - Update class
  app.put("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const validatedData = insertClassSchema.partial().parse(req.body);
      
      const updatedClass = await storage.updateClass(id, validatedData, authReq.user!.id);
      if (!updatedClass) {
        return res.status(404).json({ error: "Class not found or access denied" });
      }
      
      res.json(updatedClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      
      console.error("Error updating class:", error);
      res.status(500).json({ error: "Failed to update class" });
    }
  });
  
  // DELETE /api/classes/:id - Delete class
  app.delete("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      
      const success = await storage.deleteClass(id, authReq.user!.id);
      if (!success) {
        return res.status(404).json({ error: "Class not found or access denied" });
      }
      
      res.json({ success: true, message: "Class deleted successfully" });
    } catch (error) {
      console.error("Error deleting class:", error);
      res.status(500).json({ error: "Failed to delete class" });
    }
  });
  
  // GET /api/classes/:id/enrollments - Get class enrollments
  app.get("/api/classes/:id/enrollments", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const enrollments = await storage.getClassEnrollments(id);
      
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching class enrollments:", error);
      res.status(500).json({ error: "Failed to fetch class enrollments" });
    }
  });
  
  // Student management routes
  
  // POST /api/students - Create new student
  app.post("/api/students", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const validatedData = insertStudentSchema.parse(req.body);
      
      const newStudent = await storage.createStudent(validatedData, authReq.user!.id);
      
      res.status(201).json(newStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      
      console.error("Error creating student:", error);
      res.status(500).json({ error: "Failed to create student" });
    }
  });
  
  // GET /api/students - List students
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const students = await storage.getStudentsByUser(authReq.user!.id);
      
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });
  
  // GET /api/students/:id - Get student details
  app.get("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const student = await storage.getStudent(id);
      
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });
  
  // PUT /api/students/:id - Update student
  app.put("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const validatedData = insertStudentSchema.partial().parse(req.body);
      
      const updatedStudent = await storage.updateStudent(id, validatedData, authReq.user!.id);
      if (!updatedStudent) {
        return res.status(404).json({ error: "Student not found or access denied" });
      }
      
      res.json(updatedStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      
      console.error("Error updating student:", error);
      res.status(500).json({ error: "Failed to update student" });
    }
  });
  
  // DELETE /api/students/:id - Delete student
  app.delete("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      
      const success = await storage.deleteStudent(id, authReq.user!.id);
      if (!success) {
        return res.status(404).json({ error: "Student not found or access denied" });
      }
      
      res.json({ success: true, message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });
  
  // POST /api/classes/:classId/enroll/:studentId - Enroll student in class
  app.post("/api/classes/:classId/enroll/:studentId", requireAuth, async (req, res) => {
    try {
      const { classId, studentId } = req.params;
      
      const enrollment = await storage.enrollStudent(classId, studentId);
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Error enrolling student:", error);
      res.status(500).json({ error: "Failed to enroll student" });
    }
  });
  
  // DELETE /api/classes/:classId/enroll/:studentId - Unenroll student from class
  app.delete("/api/classes/:classId/enroll/:studentId", requireAuth, async (req, res) => {
    try {
      const { classId, studentId } = req.params;
      
      const success = await storage.unenrollStudent(classId, studentId);
      if (!success) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      
      res.json({ success: true, message: "Student unenrolled successfully" });
    } catch (error) {
      console.error("Error unenrolling student:", error);
      res.status(500).json({ error: "Failed to unenroll student" });
    }
  });
  
  // Attendance management routes
  
  // POST /api/attendance - Mark attendance
  app.post("/api/attendance", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const validatedData = markAttendanceSchema.parse(req.body);
      
      const attendance = await storage.markAttendance({
        ...validatedData,
        markedBy: authReq.user!.id,
      });
      
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      
      console.error("Error marking attendance:", error);
      res.status(500).json({ error: "Failed to mark attendance" });
    }
  });
  
  // POST /api/attendance/bulk - Bulk mark attendance
  app.post("/api/attendance/bulk", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const validatedData = bulkAttendanceSchema.parse(req.body);
      
      const attendanceRecords = validatedData.records.map(record => ({
        ...record,
        classId: validatedData.classId,
        date: validatedData.date,
        markedBy: authReq.user!.id,
      }));
      
      const results = await storage.bulkMarkAttendance(attendanceRecords);
      res.status(201).json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      
      console.error("Error bulk marking attendance:", error);
      res.status(500).json({ error: "Failed to bulk mark attendance" });
    }
  });
  
  // GET /api/attendance/class/:classId - Get attendance by class
  app.get("/api/attendance/class/:classId", requireAuth, async (req, res) => {
    try {
      const { classId } = req.params;
      const { date } = req.query;
      
      const attendance = await storage.getAttendanceByClass(classId, date as string);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching class attendance:", error);
      res.status(500).json({ error: "Failed to fetch class attendance" });
    }
  });
  
  // GET /api/attendance/student/:studentId - Get attendance by student
  app.get("/api/attendance/student/:studentId", requireAuth, async (req, res) => {
    try {
      const { studentId } = req.params;
      const { classId } = req.query;
      
      const attendance = await storage.getAttendanceByStudent(studentId, classId as string);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      res.status(500).json({ error: "Failed to fetch student attendance" });
    }
  });
  
  // PUT /api/attendance/:id - Update attendance record
  app.put("/api/attendance/:id", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const validatedData = insertAttendanceRecordSchema.partial().parse(req.body);
      
      const updatedAttendance = await storage.updateAttendance(id, validatedData, authReq.user!.id);
      if (!updatedAttendance) {
        return res.status(404).json({ error: "Attendance record not found or access denied" });
      }
      
      res.json(updatedAttendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: error.errors 
        });
      }
      
      console.error("Error updating attendance:", error);
      res.status(500).json({ error: "Failed to update attendance" });
    }
  });
  
  // DELETE /api/attendance/:id - Delete attendance record
  app.delete("/api/attendance/:id", requireAuth, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      
      const success = await storage.deleteAttendanceRecord(id, authReq.user!.id);
      if (!success) {
        return res.status(404).json({ error: "Attendance record not found or access denied" });
      }
      
      res.json({ success: true, message: "Attendance record deleted successfully" });
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      res.status(500).json({ error: "Failed to delete attendance record" });
    }
  });
  
  // GET /api/attendance/stats/:classId - Get attendance statistics for a class
  app.get("/api/attendance/stats/:classId", requireAuth, async (req, res) => {
    try {
      const { classId } = req.params;
      const { startDate, endDate } = req.query;
      
      const stats = await storage.getAttendanceStats(
        classId, 
        startDate as string, 
        endDate as string
      );
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      res.status(500).json({ error: "Failed to fetch attendance stats" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
