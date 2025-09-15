// Simple script to create test data in memory storage
import { storage } from './server/storage.js';

async function createTestData() {
  console.log('Creating test data...');
  
  try {
    // Create a default user
    const user = await storage.createUser({
      username: 'anonymous',
      password: 'placeholder'
    });
    console.log('Created user:', user.id);

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
    console.log('Created class:', testClass.id);

    // Create test students
    const students = [];
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
      students.push(student);
      console.log('Created student:', student.firstName, student.lastName);

      // Enroll student in class
      await storage.enrollStudent(testClass.id, student.id);
      console.log('Enrolled', student.firstName, 'in', testClass.name);
    }

    console.log('Test data created successfully!');
    console.log('Class ID:', testClass.id);
    console.log('Student count:', students.length);
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Export for use in the main server
export { createTestData };