"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.MemStorage = void 0;
const crypto_1 = require("crypto");
class MemStorage {
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
    hashPassword(password) {
        const salt = (0, crypto_1.randomBytes)(32);
        const hash = (0, crypto_1.pbkdf2Sync)(password, salt, 100000, 64, 'sha512');
        return salt.toString('hex') + ':' + hash.toString('hex');
    }
    verifyPassword(password, hashedPassword) {
        const [salt, hash] = hashedPassword.split(':');
        const hashToVerify = (0, crypto_1.pbkdf2Sync)(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha512');
        return hash === hashToVerify.toString('hex');
    }
    hashApiKey(key) {
        return (0, crypto_1.createHash)('sha256').update(key).digest('hex');
    }
    generateSecureApiKey() {
        return 'ak_' + (0, crypto_1.randomBytes)(32).toString('hex');
    }
    generateSessionToken() {
        return (0, crypto_1.randomBytes)(48).toString('hex');
    }
    async getUser(id) {
        return this.users.get(id);
    }
    async getUserByUsername(username) {
        return Array.from(this.users.values()).find((user) => user.username === username);
    }
    async createUser(insertUser) {
        const id = (0, crypto_1.randomUUID)();
        const hashedPassword = this.hashPassword(insertUser.password);
        const user = {
            ...insertUser,
            id,
            password: hashedPassword
        };
        this.users.set(id, user);
        return user;
    }
    async verifyUserPassword(username, password) {
        const user = await this.getUserByUsername(username);
        if (!user)
            return null;
        const isValid = this.verifyPassword(password, user.password);
        return isValid ? user : null;
    }
    async upsertUser(userData) {
        // Check if user exists
        let user = userData.id ? await this.getUser(userData.id) : undefined;
        if (user) {
            // Update existing user
            const updatedUser = {
                ...user,
                ...userData,
                updatedAt: new Date(),
            };
            this.users.set(user.id, updatedUser);
            return updatedUser;
        }
        else {
            // Create new user
            const id = userData.id || (0, crypto_1.randomUUID)();
            const newUser = {
                id,
                email: userData.email || null,
                firstName: userData.firstName || null,
                lastName: userData.lastName || null,
                profileImageUrl: userData.profileImageUrl || null,
                username: userData.username || null,
                password: userData.password || null,
                role: userData.role || "staff",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            this.users.set(id, newUser);
            return newUser;
        }
    }
    // Session operations
    async createSession(insertSession) {
        const id = (0, crypto_1.randomUUID)();
        const session = {
            id,
            ...insertSession,
            createdAt: new Date(),
        };
        this.sessions.set(insertSession.sessionToken, session);
        return session;
    }
    async getSession(sessionToken) {
        const session = this.sessions.get(sessionToken);
        if (!session)
            return undefined;
        // Check if session is expired
        if (new Date() > session.expiresAt) {
            this.sessions.delete(sessionToken);
            return undefined;
        }
        return session;
    }
    async deleteSession(sessionToken) {
        this.sessions.delete(sessionToken);
    }
    async deleteExpiredSessions() {
        const now = new Date();
        const entries = Array.from(this.sessions.entries());
        for (const [token, session] of entries) {
            if (now > session.expiresAt) {
                this.sessions.delete(token);
            }
        }
    }
    // API Key operations
    async createApiKey(userId, name) {
        const id = (0, crypto_1.randomUUID)();
        const rawKey = this.generateSecureApiKey();
        const keyHash = this.hashApiKey(rawKey);
        const keyPrefix = rawKey.substring(0, 12); // ak_12345678
        const now = new Date();
        const apiKey = {
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
    async getApiKeysByUserId(userId) {
        const apiKeys = Array.from(this.apiKeys.values()).filter((apiKey) => apiKey.userId === userId);
        // Return keys with masked display format
        return apiKeys.map(key => ({
            ...key,
            maskedKey: `${key.keyPrefix}${'*'.repeat(52)}`
        }));
    }
    async getApiKey(id) {
        return this.apiKeys.get(id);
    }
    async verifyApiKey(key) {
        const keyHash = this.hashApiKey(key);
        const apiKey = Array.from(this.apiKeys.values()).find((apiKey) => apiKey.keyHash === keyHash && apiKey.isActive);
        if (apiKey) {
            // Update last used timestamp
            await this.updateApiKeyLastUsed(apiKey.id);
            return apiKey;
        }
        return null;
    }
    async deleteApiKey(id, userId) {
        const apiKey = this.apiKeys.get(id);
        if (!apiKey || apiKey.userId !== userId) {
            return false; // Not found or not owned by user
        }
        this.apiKeys.delete(id);
        return true;
    }
    async updateApiKeyLastUsed(id) {
        const apiKey = this.apiKeys.get(id);
        if (apiKey) {
            const updatedApiKey = {
                ...apiKey,
                lastUsedAt: new Date(),
            };
            this.apiKeys.set(id, updatedApiKey);
        }
    }
    async toggleApiKeyActive(id, isActive, userId) {
        const apiKey = this.apiKeys.get(id);
        if (!apiKey || apiKey.userId !== userId) {
            return false; // Not found or not owned by user
        }
        const updatedApiKey = {
            ...apiKey,
            isActive,
        };
        this.apiKeys.set(id, updatedApiKey);
        return true;
    }
    // Class operations
    async createClass(classData, createdBy) {
        const id = (0, crypto_1.randomUUID)();
        const now = new Date();
        const newClass = {
            id,
            ...classData,
            createdBy,
            createdAt: now,
            updatedAt: now,
        };
        this.classes.set(id, newClass);
        return newClass;
    }
    async getClass(id) {
        return this.classes.get(id);
    }
    async getClassesByUser(userId) {
        const userClasses = Array.from(this.classes.values()).filter((cls) => cls.createdBy === userId);
        return this.enrichClassesWithStats(userClasses);
    }
    async getAllClasses() {
        const allClasses = Array.from(this.classes.values());
        return this.enrichClassesWithStats(allClasses);
    }
    async updateClass(id, classData, userId) {
        const existingClass = this.classes.get(id);
        if (!existingClass || existingClass.createdBy !== userId) {
            return null;
        }
        const updatedClass = {
            ...existingClass,
            ...classData,
            updatedAt: new Date(),
        };
        this.classes.set(id, updatedClass);
        return updatedClass;
    }
    async deleteClass(id, userId) {
        const existingClass = this.classes.get(id);
        if (!existingClass || existingClass.createdBy !== userId) {
            return false;
        }
        // Delete related enrollments and attendance records
        const enrollments = Array.from(this.classEnrollments.values()).filter((enrollment) => enrollment.classId === id);
        enrollments.forEach((enrollment) => this.classEnrollments.delete(enrollment.id));
        const attendanceRecords = Array.from(this.attendanceRecords.values()).filter((record) => record.classId === id);
        attendanceRecords.forEach((record) => this.attendanceRecords.delete(record.id));
        this.classes.delete(id);
        return true;
    }
    // Student operations
    async createStudent(studentData, createdBy) {
        const id = (0, crypto_1.randomUUID)();
        const now = new Date();
        const newStudent = {
            id,
            ...studentData,
            createdBy,
            createdAt: now,
            updatedAt: now,
        };
        this.students.set(id, newStudent);
        return newStudent;
    }
    async getStudent(id) {
        return this.students.get(id);
    }
    async getStudentByStudentId(studentId) {
        return Array.from(this.students.values()).find((student) => student.studentId === studentId);
    }
    async getStudentByEmail(email) {
        return Array.from(this.students.values()).find((student) => student.email === email);
    }
    async getStudentsByUser(userId) {
        return Array.from(this.students.values()).filter((student) => student.createdBy === userId);
    }
    async getAllStudents() {
        return Array.from(this.students.values());
    }
    async updateStudent(id, studentData, userId) {
        const existingStudent = this.students.get(id);
        if (!existingStudent || existingStudent.createdBy !== userId) {
            return null;
        }
        const updatedStudent = {
            ...existingStudent,
            ...studentData,
            updatedAt: new Date(),
        };
        this.students.set(id, updatedStudent);
        return updatedStudent;
    }
    async deleteStudent(id, userId) {
        const existingStudent = this.students.get(id);
        if (!existingStudent || existingStudent.createdBy !== userId) {
            return false;
        }
        // Delete related enrollments and attendance records
        const enrollments = Array.from(this.classEnrollments.values()).filter((enrollment) => enrollment.studentId === id);
        enrollments.forEach((enrollment) => this.classEnrollments.delete(enrollment.id));
        const attendanceRecords = Array.from(this.attendanceRecords.values()).filter((record) => record.studentId === id);
        attendanceRecords.forEach((record) => this.attendanceRecords.delete(record.id));
        this.students.delete(id);
        return true;
    }
    // Class enrollment operations
    async enrollStudent(classId, studentId) {
        const id = (0, crypto_1.randomUUID)();
        const enrollment = {
            id,
            classId,
            studentId,
            enrolledAt: new Date(),
            status: "enrolled",
        };
        this.classEnrollments.set(id, enrollment);
        return enrollment;
    }
    async unenrollStudent(classId, studentId) {
        const enrollment = Array.from(this.classEnrollments.values()).find((e) => e.classId === classId && e.studentId === studentId);
        if (!enrollment) {
            return false;
        }
        this.classEnrollments.delete(enrollment.id);
        return true;
    }
    async getClassEnrollments(classId) {
        const enrollments = Array.from(this.classEnrollments.values()).filter((enrollment) => enrollment.classId === classId && enrollment.status === "enrolled");
        const studentsWithEnrollment = [];
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
    async getStudentEnrollments(studentId) {
        return Array.from(this.classEnrollments.values()).filter((enrollment) => enrollment.studentId === studentId);
    }
    // Attendance operations
    async markAttendance(attendanceData) {
        const id = (0, crypto_1.randomUUID)();
        const now = new Date();
        // Ensure date is present
        if (!attendanceData.date) {
            throw new Error("Date is required for marking attendance");
        }
        const attendance = {
            id,
            ...attendanceData,
            markedAt: now,
            updatedAt: now,
        };
        this.attendanceRecords.set(id, attendance);
        return attendance;
    }
    async getAttendanceRecord(id) {
        return this.attendanceRecords.get(id);
    }
    async getAttendanceByClass(classId, date) {
        let records = Array.from(this.attendanceRecords.values()).filter((record) => record.classId === classId);
        if (date) {
            records = records.filter((record) => record.date === date);
        }
        return this.enrichAttendanceWithDetails(records);
    }
    async getAttendanceByStudent(studentId, classId) {
        let records = Array.from(this.attendanceRecords.values()).filter((record) => record.studentId === studentId);
        if (classId) {
            records = records.filter((record) => record.classId === classId);
        }
        return this.enrichAttendanceWithDetails(records);
    }
    async updateAttendance(id, attendanceData, userId) {
        const existingRecord = this.attendanceRecords.get(id);
        if (!existingRecord || existingRecord.markedBy !== userId) {
            return null;
        }
        const updatedRecord = {
            ...existingRecord,
            ...attendanceData,
            updatedAt: new Date(),
        };
        this.attendanceRecords.set(id, updatedRecord);
        return updatedRecord;
    }
    async deleteAttendanceRecord(id, userId) {
        const existingRecord = this.attendanceRecords.get(id);
        if (!existingRecord || existingRecord.markedBy !== userId) {
            return false;
        }
        this.attendanceRecords.delete(id);
        return true;
    }
    async bulkMarkAttendance(records) {
        const results = [];
        for (const recordData of records) {
            const record = await this.markAttendance(recordData);
            results.push(record);
        }
        return results;
    }
    async getAttendanceStats(classId, startDate, endDate) {
        let records = Array.from(this.attendanceRecords.values()).filter((record) => record.classId === classId);
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
                stats[record.status]++;
            }
        });
        return stats;
    }
    // Helper methods
    async enrichClassesWithStats(classes) {
        const enrichedClasses = [];
        for (const cls of classes) {
            const enrollments = Array.from(this.classEnrollments.values()).filter((enrollment) => enrollment.classId === cls.id && enrollment.status === "enrolled");
            const attendanceStats = await this.getAttendanceStats(cls.id);
            enrichedClasses.push({
                ...cls,
                enrolledCount: enrollments.length,
                attendanceStats,
            });
        }
        return enrichedClasses;
    }
    async enrichAttendanceWithDetails(records) {
        const enrichedRecords = [];
        for (const record of records) {
            const student = this.students.get(record.studentId);
            const cls = this.classes.get(record.classId);
            const markedByUser = this.users.get(record.markedBy);
            // If we have at least the student and class, include the record
            if (student && cls) {
                const markedByUserSafe = markedByUser
                    ? { ...markedByUser, password: undefined }
                    : { id: record.markedBy, username: record.markedBy, role: "staff" };
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
exports.MemStorage = MemStorage;
exports.storage = new MemStorage();
