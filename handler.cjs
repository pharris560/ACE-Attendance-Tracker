"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const memorystore_1 = __importDefault(require("memorystore"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const routes_1 = require("./server/routes.cjs");
const vite_1 = require("./vite");
const storage_1 = require("./storage");
// Function to create test data for development
async function createTestData() {
    try {
        // Check if test data already exists
        const existingClasses = await storage_1.storage.getAllClasses();
        if (existingClasses.length > 0) {
            (0, vite_1.log)('Test data already exists, skipping creation');
            return;
        }
        (0, vite_1.log)('Creating test data...');
        // Create a default user
        const user = await storage_1.storage.createUser({
            username: 'anonymous',
            password: 'placeholder'
        });
        // Create a test class
        const testClass = await storage_1.storage.createClass({
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
            const student = await storage_1.storage.createStudent({
                ...studentInfo,
                status: 'active',
                phone: null,
                dateOfBirth: null,
                enrollmentDate: new Date().toISOString().split('T')[0]
            }, user.id);
            // Enroll student in class
            await storage_1.storage.enrollStudent(testClass.id, student.id);
        }
        (0, vite_1.log)('Test data created successfully!');
    }
    catch (error) {
        (0, vite_1.log)('Error creating test data:', error);
    }
}
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// Session configuration
const MemoryStoreSession = (0, memorystore_1.default)(express_session_1.default);
app.use((0, express_session_1.default)({
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
    let capturedJsonResponse = undefined;
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
            (0, vite_1.log)(logLine);
        }
    });
    next();
});
// Initialize the app
async function initializeApp() {
    // Create test data in development/staging
    if (process.env.NODE_ENV !== 'production') {
        await createTestData();
    }
    await (0, routes_1.registerRoutes)(app);
    app.use((err, req, res, next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        console.error('Error:', err);
        res.status(status).json({ message });
    });
    // For production (Lambda), serve static files
    if (process.env.NODE_ENV === 'production') {
        (0, vite_1.serveStatic)(app);
    }
    return app;
}
// For AWS Lambda
let appPromise = null;
const handler = async (event, context) => {
    // Initialize app only once (cold start)
    if (!appPromise) {
        appPromise = initializeApp();
    }
    const app = await appPromise;
    const serverlessHandler = (0, serverless_http_1.default)(app);
    return serverlessHandler(event, context);
};
exports.handler = handler;
// For local development
if (require.main === module) {
    (async () => {
        const app = await initializeApp();
        const port = parseInt(process.env.PORT || '5000', 10);
        app.listen(port, '0.0.0.0', () => {
            (0, vite_1.log)(`serving on port ${port}`);
        });
    })();
}
