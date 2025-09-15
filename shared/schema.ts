import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(), // Store first 8 chars for display (ak_12345678)
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  lastUsedAt: timestamp("last_used_at"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// User session type for authentication
export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Classes table
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  instructor: text("instructor").notNull(),
  location: text("location"),
  capacity: integer("capacity").notNull().default(30),
  schedule: text("schedule").notNull(), // JSON string for schedule data
  status: text("status").notNull().default("active"), // active, inactive, completed
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: text("student_id").notNull().unique(), // Student ID number
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: date("date_of_birth"),
  enrollmentDate: date("enrollment_date").notNull().default(sql`current_date`),
  status: text("status").notNull().default("active"), // active, inactive, graduated
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Class enrollments table - many-to-many relationship between classes and students
export const classEnrollments = pgTable("class_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").notNull().default(sql`now()`),
  status: text("status").notNull().default("enrolled"), // enrolled, dropped, completed
});

// Attendance records table
export const attendanceRecords = pgTable("attendance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId: varchar("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: text("status").notNull(), // present, absent, tardy, excused
  notes: text("notes"),
  // Location tracking fields
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  locationAccuracy: numeric("location_accuracy"), // accuracy in meters
  locationAddress: text("location_address"), // human-readable address
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  markedBy: varchar("marked_by").notNull().references(() => users.id),
  markedAt: timestamp("marked_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  name: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).pick({
  userId: true,
  sessionToken: true,
  expiresAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClassEnrollmentSchema = createInsertSchema(classEnrollments).omit({
  id: true,
  enrolledAt: true,
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  markedAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Attendance management schemas
export const attendanceStatusSchema = z.enum(["present", "absent", "tardy", "excused"]);

export const markAttendanceSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  studentId: z.string().min(1, "Student ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  status: attendanceStatusSchema,
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationAccuracy: z.number().optional(),
  locationAddress: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
});

export const bulkAttendanceSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  records: z.array(z.object({
    studentId: z.string().min(1, "Student ID is required"),
    status: attendanceStatusSchema,
    notes: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    locationAccuracy: z.number().optional(),
  })),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

// Class management types
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;
export type InsertClassEnrollment = z.infer<typeof insertClassEnrollmentSchema>;
export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// Attendance management types
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;
export type MarkAttendanceRequest = z.infer<typeof markAttendanceSchema>;
export type BulkAttendanceRequest = z.infer<typeof bulkAttendanceSchema>;

// Additional types for API responses
export type ApiKeyWithRawKey = Omit<ApiKey, 'keyHash'> & { key: string };
export type ApiKeyDisplay = Omit<ApiKey, 'keyHash'> & { maskedKey: string };

// Complex types for UI components
export type StudentWithEnrollment = Student & {
  enrollment?: ClassEnrollment;
  latestAttendance?: AttendanceRecord;
};

export type ClassWithStats = Class & {
  enrolledCount: number;
  attendanceStats?: {
    present: number;
    absent: number;
    tardy: number;
    excused: number;
  };
};

export type AttendanceRecordWithDetails = AttendanceRecord & {
  student: Student;
  class: Class;
  markedByUser: Omit<User, 'password'>;
};
