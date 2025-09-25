import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

// Function to create test data for development
async function createTestData() {
  try {
    // Check if test data already exists
    const existingClasses = await storage.getAllClasses();
    if (existingClasses.length > 0) {
      log('Test data already exists, skipping creation');
      return;
    }

    log('Creating test data...');
    
    // Create a default user
    const user = await storage.createUser({
      username: 'anonymous',
      password: 'placeholder'
    });

    // Create a test class
    const testClass = await storage.createClass({
      name: 'Mathematics 101',
      description: 'Basic Mathematics Course',
      instructor: 'Prof. Smith',
      capacity: 30,
      location: 'Room 101',
      schedule: '{"days":"mon-wed-fri","time":"10:00-11:00"}',
      status: 'active'
    }, user.id);

    // Create test students
    const studentData = [
      { firstName: 'Alice', lastName: 'Johnson', studentId: 'STU001', email: 'alice@example.com' },
      { firstName: 'Bob', lastName: 'Wilson', studentId: 'STU002', email: 'bob@example.com' },
      { firstName: 'Carol', lastName: 'Davis', studentId: 'STU003', email: 'carol@example.com' },
      { firstName: 'David', lastName: 'Brown', studentId: 'STU004', email: 'david@example.com' }
    ];

    for (const studentInfo of studentData) {
      const student = await storage.createStudent({
        ...studentInfo,
        status: 'active',
        phone: null,
        dateOfBirth: null,
        enrollmentDate: new Date().toISOString().split('T')[0]
      }, user.id);

      // Enroll student in class
      await storage.enrollStudent(testClass.id, student.id);
    }

    log('Test data created successfully!');
  } catch (error) {
    log('Error creating test data:', error);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
const MemoryStoreSession = MemoryStore(session);

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create test data in development
  if (app.get("env") === "development") {
    await createTestData();
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
