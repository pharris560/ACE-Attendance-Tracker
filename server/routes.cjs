const { storage } = require("./storage.cjs");

async function registerRoutes(app) {
  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // Get all classes
  app.get('/api/classes', async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ error: 'Failed to fetch classes' });
    }
  });

  // Get all students
  app.get('/api/students', async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  // Root route
  app.get('/', (req, res) => {
    res.json({ message: 'ACE Attendance Tracker API', status: 'running' });
  });

  return app;
}

module.exports = { registerRoutes };
