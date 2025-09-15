// Demo data creation script
const API_BASE = 'http://localhost:5000';

async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(global.sessionCookie ? { 'Cookie': global.sessionCookie } : {})
    },
    credentials: 'include'
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  
  // Store session cookie for subsequent requests
  if (response.headers.get('set-cookie')) {
    global.sessionCookie = response.headers.get('set-cookie');
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }
  
  return response.json();
}

async function createDemoData() {
  try {
    console.log('🚀 Creating demo data...');
    
    // 1. Register demo user
    console.log('👤 Creating demo user...');
    try {
      await apiCall('/api/auth/register', 'POST', {
        username: 'demo',
        password: 'demo123456'
      });
      console.log('✅ Demo user created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Demo user already exists');
      } else {
        throw error;
      }
    }
    
    // 2. Login as demo user
    console.log('🔐 Logging in...');
    await apiCall('/api/auth/login', 'POST', {
      username: 'demo',
      password: 'demo123456'
    });
    console.log('✅ Logged in successfully');
    
    // 3. Create demo classes
    console.log('📚 Creating demo classes...');
    const demoClasses = [
      {
        name: 'Mathematics 101',
        description: 'Introduction to basic mathematical concepts including algebra, geometry, and statistics.',
        instructor: 'Dr. Sarah Wilson',
        location: 'Room A-101',
        capacity: 30,
        schedule: 'Mon, Wed, Fri 9:00-10:00 AM',
        status: 'active',
        createdBy: 'demo'
      },
      {
        name: 'Physics 201',
        description: 'Advanced physics course covering mechanics, thermodynamics, and electromagnetism.',
        instructor: 'Prof. Michael Chen',
        location: 'Lab B-204',
        capacity: 25,
        schedule: 'Tue, Thu 11:00 AM-12:30 PM',
        status: 'active',
        createdBy: 'demo'
      },
      {
        name: 'Chemistry 150',
        description: 'General chemistry fundamentals with laboratory experiments.',
        instructor: 'Dr. Emily Rodriguez',
        location: 'Lab C-105',
        capacity: 20,
        schedule: 'Mon, Wed 2:00-3:30 PM',
        status: 'active',
        createdBy: 'demo'
      }
    ];
    
    const createdClasses = [];
    for (const classData of demoClasses) {
      const result = await apiCall('/api/classes', 'POST', classData);
      createdClasses.push(result);
      console.log(`✅ Created class: ${result.name}`);
    }
    
    // 4. Create demo students
    console.log('👨‍🎓 Creating demo students...');
    const demoStudents = [
      {
        studentId: 'STU001',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '555-0101',
        dateOfBirth: '2000-01-15',
        status: 'active',
        createdBy: 'demo'
      },
      {
        studentId: 'STU002', 
        firstName: 'Emma',
        lastName: 'Johnson',
        email: 'emma.johnson@example.com',
        phone: '555-0102',
        dateOfBirth: '2001-03-22',
        status: 'active',
        createdBy: 'demo'
      },
      {
        studentId: 'STU003',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@example.com',
        phone: '555-0103',
        dateOfBirth: '1999-11-08',
        status: 'active',
        createdBy: 'demo'
      },
      {
        studentId: 'STU004',
        firstName: 'Sarah',
        lastName: 'Davis',
        email: 'sarah.davis@example.com',
        phone: '555-0104',
        dateOfBirth: '2000-07-14',
        status: 'active',
        createdBy: 'demo'
      },
      {
        studentId: 'STU005',
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@example.com',
        phone: '555-0105',
        dateOfBirth: '2001-05-30',
        status: 'active',
        createdBy: 'demo'
      }
    ];
    
    const createdStudents = [];
    for (const studentData of demoStudents) {
      const result = await apiCall('/api/students', 'POST', studentData);
      createdStudents.push(result);
      console.log(`✅ Created student: ${result.firstName} ${result.lastName}`);
    }
    
    // 5. Create enrollments - enroll all students in all classes
    console.log('📝 Creating enrollments...');
    for (const classData of createdClasses) {
      for (const studentData of createdStudents) {
        try {
          await apiCall(`/api/classes/${classData.id}/enroll/${studentData.id}`, 'POST');
          console.log(`✅ Enrolled ${studentData.firstName} ${studentData.lastName} in ${classData.name}`);
        } catch (error) {
          console.log(`⚠️ Failed to enroll ${studentData.firstName} ${studentData.lastName} in ${classData.name}: ${error.message}`);
        }
      }
    }
    
    console.log('🎉 Demo data creation completed successfully!');
    console.log(`📊 Created: ${createdClasses.length} classes, ${createdStudents.length} students`);
    console.log('🔗 Username: demo, Password: demo123456');
    
  } catch (error) {
    console.error('❌ Error creating demo data:', error.message);
    process.exit(1);
  }
}

// Run the script
createDemoData();