import { 
  type User, 
  type InsertUser, 
  type ApiKey, 
  type InsertApiKey,
  type UserSession,
  type InsertUserSession,
  type ApiKeyWithRawKey,
  type ApiKeyDisplay,
  type Class,
  type InsertClass,
  type Student,
  type InsertStudent,
  type ClassEnrollment,
  type InsertClassEnrollment,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type ClassWithStats,
  type StudentWithEnrollment,
  type AttendanceRecordWithDetails
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
  
  // Class operations
  createClass(classData: InsertClass, createdBy: string): Promise<Class>;
  getClass(id: string): Promise<Class | undefined>;
  getClassesByUser(userId: string): Promise<ClassWithStats[]>;
  getAllClasses(): Promise<ClassWithStats[]>;
  updateClass(id: string, classData: Partial<InsertClass>, userId: string): Promise<Class | null>;
  deleteClass(id: string, userId: string): Promise<boolean>;
  
  // Student operations
  createStudent(studentData: InsertStudent, createdBy: string): Promise<Student>;
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  getStudentsByUser(userId: string): Promise<Student[]>;
  getAllStudents(): Promise<Student[]>;
  updateStudent(id: string, studentData: Partial<InsertStudent>, userId: string): Promise<Student | null>;
  deleteStudent(id: string, userId: string): Promise<boolean>;
  
  // Class enrollment operations
  enrollStudent(classId: string, studentId: string): Promise<ClassEnrollment>;
  unenrollStudent(classId: string, studentId: string): Promise<boolean>;
  getClassEnrollments(classId: string): Promise<StudentWithEnrollment[]>;
  getStudentEnrollments(studentId: string): Promise<ClassEnrollment[]>;
  
  // Attendance operations
  markAttendance(attendanceData: InsertAttendanceRecord): Promise<AttendanceRecord>;
  getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined>;
  getAttendanceByClass(classId: string, date?: string): Promise<AttendanceRecordWithDetails[]>;
  getAttendanceByStudent(studentId: string, classId?: string): Promise<AttendanceRecordWithDetails[]>;
  updateAttendance(id: string, attendanceData: Partial<InsertAttendanceRecord>, userId: string): Promise<AttendanceRecord | null>;
  deleteAttendanceRecord(id: string, userId: string): Promise<boolean>;
  bulkMarkAttendance(records: InsertAttendanceRecord[]): Promise<AttendanceRecord[]>;
  getAttendanceStats(classId: string, startDate?: string, endDate?: string): Promise<{ present: number; absent: number; tardy: number; excused: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private apiKeys: Map<string, ApiKey>;
  private sessions: Map<string, UserSession>;
  private classes: Map<string, Class>;
  private students: Map<string, Student>;
  private classEnrollments: Map<string, ClassEnrollment>;
  private attendanceRecords: Map<string, AttendanceRecord>;

  constructor() {
    this.users = new Map();
    this.apiKeys = new Map();
    this.sessions = new Map();
    this.classes = new Map();
    this.students = new Map();
    this.classEnrollments = new Map();
    this.attendanceRecords = new Map();
    
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

  // Class operations
  async createClass(classData: InsertClass, createdBy: string): Promise<Class> {
    const id = randomUUID();
    const now = new Date();
    const newClass: Class = {
      id,
      ...classData,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.classes.set(id, newClass);
    return newClass;
  }

  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClassesByUser(userId: string): Promise<ClassWithStats[]> {
    const userClasses = Array.from(this.classes.values()).filter(
      (cls) => cls.createdBy === userId
    );
    return this.enrichClassesWithStats(userClasses);
  }

  async getAllClasses(): Promise<ClassWithStats[]> {
    const allClasses = Array.from(this.classes.values());
    return this.enrichClassesWithStats(allClasses);
  }

  async updateClass(id: string, classData: Partial<InsertClass>, userId: string): Promise<Class | null> {
    const existingClass = this.classes.get(id);
    if (!existingClass || existingClass.createdBy !== userId) {
      return null;
    }
    
    const updatedClass: Class = {
      ...existingClass,
      ...classData,
      updatedAt: new Date(),
    };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async deleteClass(id: string, userId: string): Promise<boolean> {
    const existingClass = this.classes.get(id);
    if (!existingClass || existingClass.createdBy !== userId) {
      return false;
    }
    
    // Delete related enrollments and attendance records
    const enrollments = Array.from(this.classEnrollments.values()).filter(
      (enrollment) => enrollment.classId === id
    );
    enrollments.forEach((enrollment) => this.classEnrollments.delete(enrollment.id));
    
    const attendanceRecords = Array.from(this.attendanceRecords.values()).filter(
      (record) => record.classId === id
    );
    attendanceRecords.forEach((record) => this.attendanceRecords.delete(record.id));
    
    this.classes.delete(id);
    return true;
  }

  // Student operations
  async createStudent(studentData: InsertStudent, createdBy: string): Promise<Student> {
    const id = randomUUID();
    const now = new Date();
    const newStudent: Student = {
      id,
      ...studentData,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.studentId === studentId
    );
  }

  async getStudentsByUser(userId: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.createdBy === userId
    );
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async updateStudent(id: string, studentData: Partial<InsertStudent>, userId: string): Promise<Student | null> {
    const existingStudent = this.students.get(id);
    if (!existingStudent || existingStudent.createdBy !== userId) {
      return null;
    }
    
    const updatedStudent: Student = {
      ...existingStudent,
      ...studentData,
      updatedAt: new Date(),
    };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: string, userId: string): Promise<boolean> {
    const existingStudent = this.students.get(id);
    if (!existingStudent || existingStudent.createdBy !== userId) {
      return false;
    }
    
    // Delete related enrollments and attendance records
    const enrollments = Array.from(this.classEnrollments.values()).filter(
      (enrollment) => enrollment.studentId === id
    );
    enrollments.forEach((enrollment) => this.classEnrollments.delete(enrollment.id));
    
    const attendanceRecords = Array.from(this.attendanceRecords.values()).filter(
      (record) => record.studentId === id
    );
    attendanceRecords.forEach((record) => this.attendanceRecords.delete(record.id));
    
    this.students.delete(id);
    return true;
  }

  // Class enrollment operations
  async enrollStudent(classId: string, studentId: string): Promise<ClassEnrollment> {
    const id = randomUUID();
    const enrollment: ClassEnrollment = {
      id,
      classId,
      studentId,
      enrolledAt: new Date(),
      status: "enrolled",
    };
    this.classEnrollments.set(id, enrollment);
    return enrollment;
  }

  async unenrollStudent(classId: string, studentId: string): Promise<boolean> {
    const enrollment = Array.from(this.classEnrollments.values()).find(
      (e) => e.classId === classId && e.studentId === studentId
    );
    
    if (!enrollment) {
      return false;
    }
    
    this.classEnrollments.delete(enrollment.id);
    return true;
  }

  async getClassEnrollments(classId: string): Promise<StudentWithEnrollment[]> {
    const enrollments = Array.from(this.classEnrollments.values()).filter(
      (enrollment) => enrollment.classId === classId && enrollment.status === "enrolled"
    );
    
    const studentsWithEnrollment: StudentWithEnrollment[] = [];
    for (const enrollment of enrollments) {
      const student = this.students.get(enrollment.studentId);
      if (student) {
        // Get latest attendance record for this student in this class
        const latestAttendance = Array.from(this.attendanceRecords.values())
          .filter((record) => record.studentId === student.id && record.classId === classId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        studentsWithEnrollment.push({
          ...student,
          enrollment,
          latestAttendance,
        });
      }
    }
    
    return studentsWithEnrollment;
  }

  async getStudentEnrollments(studentId: string): Promise<ClassEnrollment[]> {
    return Array.from(this.classEnrollments.values()).filter(
      (enrollment) => enrollment.studentId === studentId
    );
  }

  // Attendance operations
  async markAttendance(attendanceData: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const id = randomUUID();
    const now = new Date();
    const attendance: AttendanceRecord = {
      id,
      ...attendanceData,
      markedAt: now,
      updatedAt: now,
    };
    this.attendanceRecords.set(id, attendance);
    return attendance;
  }

  async getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined> {
    return this.attendanceRecords.get(id);
  }

  async getAttendanceByClass(classId: string, date?: string): Promise<AttendanceRecordWithDetails[]> {
    let records = Array.from(this.attendanceRecords.values()).filter(
      (record) => record.classId === classId
    );
    
    if (date) {
      records = records.filter((record) => record.date === date);
    }
    
    return this.enrichAttendanceWithDetails(records);
  }

  async getAttendanceByStudent(studentId: string, classId?: string): Promise<AttendanceRecordWithDetails[]> {
    let records = Array.from(this.attendanceRecords.values()).filter(
      (record) => record.studentId === studentId
    );
    
    if (classId) {
      records = records.filter((record) => record.classId === classId);
    }
    
    return this.enrichAttendanceWithDetails(records);
  }

  async updateAttendance(id: string, attendanceData: Partial<InsertAttendanceRecord>, userId: string): Promise<AttendanceRecord | null> {
    const existingRecord = this.attendanceRecords.get(id);
    if (!existingRecord || existingRecord.markedBy !== userId) {
      return null;
    }
    
    const updatedRecord: AttendanceRecord = {
      ...existingRecord,
      ...attendanceData,
      updatedAt: new Date(),
    };
    this.attendanceRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async deleteAttendanceRecord(id: string, userId: string): Promise<boolean> {
    const existingRecord = this.attendanceRecords.get(id);
    if (!existingRecord || existingRecord.markedBy !== userId) {
      return false;
    }
    
    this.attendanceRecords.delete(id);
    return true;
  }

  async bulkMarkAttendance(records: InsertAttendanceRecord[]): Promise<AttendanceRecord[]> {
    const results: AttendanceRecord[] = [];
    for (const recordData of records) {
      const record = await this.markAttendance(recordData);
      results.push(record);
    }
    return results;
  }

  async getAttendanceStats(classId: string, startDate?: string, endDate?: string): Promise<{ present: number; absent: number; tardy: number; excused: number }> {
    let records = Array.from(this.attendanceRecords.values()).filter(
      (record) => record.classId === classId
    );
    
    if (startDate) {
      records = records.filter((record) => record.date >= startDate);
    }
    
    if (endDate) {
      records = records.filter((record) => record.date <= endDate);
    }
    
    const stats = {
      present: 0,
      absent: 0,
      tardy: 0,
      excused: 0,
    };
    
    records.forEach((record) => {
      if (record.status in stats) {
        stats[record.status as keyof typeof stats]++;
      }
    });
    
    return stats;
  }

  // Helper methods
  private async enrichClassesWithStats(classes: Class[]): Promise<ClassWithStats[]> {
    const enrichedClasses: ClassWithStats[] = [];
    
    for (const cls of classes) {
      const enrollments = Array.from(this.classEnrollments.values()).filter(
        (enrollment) => enrollment.classId === cls.id && enrollment.status === "enrolled"
      );
      
      const attendanceStats = await this.getAttendanceStats(cls.id);
      
      enrichedClasses.push({
        ...cls,
        enrolledCount: enrollments.length,
        attendanceStats,
      });
    }
    
    return enrichedClasses;
  }

  private async enrichAttendanceWithDetails(records: AttendanceRecord[]): Promise<AttendanceRecordWithDetails[]> {
    const enrichedRecords: AttendanceRecordWithDetails[] = [];
    
    for (const record of records) {
      const student = this.students.get(record.studentId);
      const cls = this.classes.get(record.classId);
      const markedByUser = this.users.get(record.markedBy);
      
      if (student && cls && markedByUser) {
        const { password: _, ...markedByUserSafe } = markedByUser;
        enrichedRecords.push({
          ...record,
          student,
          class: cls,
          markedByUser: markedByUserSafe,
        });
      }
    }
    
    return enrichedRecords;
  }
}

export const storage = new MemStorage();
