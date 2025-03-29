import { pgTable, text, serial, integer, boolean, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum('role', ['admin', 'pharmacist', 'doctor', 'patient']);
export const transactionStatusEnum = pgEnum('transaction_status', ['completed', 'pending', 'cancelled']);
export const stockStatusEnum = pgEnum('stock_status', ['in_stock', 'low_stock', 'critical', 'out_of_stock']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: roleEnum("role").notNull().default('pharmacist'),
  contactNumber: text("contact_number"),
  address: text("address"),
  dateJoined: timestamp("date_joined").defaultNow().notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorVerified: boolean("two_factor_verified").default(false),
  notificationPreferences: text("notification_preferences"), // Stored as JSON string
});

// Medicines table
export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  price: integer("price").notNull(), // stored in cents
  stockQuantity: integer("stock_quantity").notNull().default(0),
  stockStatus: stockStatusEnum("stock_status").notNull().default('in_stock'),
  expiryDate: date("expiry_date"),
  batchNumber: text("batch_number"),
  supplierId: integer("supplier_id").references(() => suppliers.id),
});

// Patients table
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  contactNumber: text("contact_number"),
  email: text("email"),
  address: text("address"),
  allergies: text("allergies"),
  medicalHistory: text("medical_history"),
});

// Doctors table
export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  specialization: text("specialization").notNull(),
  contactNumber: text("contact_number"),
  email: text("email"),
  address: text("address"),
  licenseNumber: text("license_number").notNull(),
  qualifications: text("qualifications"),
  bio: text("bio"),
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  prescriptionNumber: text("prescription_number").notNull().unique(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  doctorId: integer("doctor_id").references(() => doctors.id).notNull(),
  issueDate: date("issue_date").notNull(),
  notes: text("notes"),
});

// Prescription Items table
export const prescriptionItems = pgTable("prescription_items", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id).notNull(),
  medicineId: integer("medicine_id").references(() => medicines.id).notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  duration: text("duration").notNull(),
  quantity: integer("quantity").notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id).notNull(),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id),
  transactionNumber: text("transaction_number").notNull(),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  totalAmount: integer("total_amount").notNull(), // stored in cents
  status: transactionStatusEnum("status").notNull().default('pending'),
  notes: text("notes"),
  patientName: text("patient_name"), // For display purposes
});

// Transaction Items table
export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id).notNull(),
  medicineId: integer("medicine_id").references(() => medicines.id).notNull(),
  medicineName: text("medicine_name").notNull(), // For display purposes
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(), // stored in cents
  unitPrice: integer("unit_price").notNull(), // stored in cents, price per unit
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  contactNumber: text("contact_number"),
  email: text("email"),
  address: text("address"),
  website: text("website"),
  notes: text("notes"),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id).notNull(),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  expectedDeliveryDate: date("expected_delivery_date"),
  status: text("status").notNull().default('pending'),
  notes: text("notes"),
});

// Order Items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  medicineId: integer("medicine_id").references(() => medicines.id).notNull(),
  quantity: integer("quantity").notNull(),
});

// Zod Schemas for Insert
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  contactNumber: true,
  address: true,
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  stockStatus: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
});

export const insertPrescriptionItemSchema = createInsertSchema(prescriptionItems).omit({
  id: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  transactionDate: true,
  status: true,
});

export const insertTransactionItemSchema = createInsertSchema(transactionItems).omit({
  id: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderDate: true,
  status: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Export types for each model
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Medicine = typeof medicines.$inferSelect;

export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect;

export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptions.$inferSelect;

export type InsertPrescriptionItem = z.infer<typeof insertPrescriptionItemSchema>;
export type PrescriptionItem = typeof prescriptionItems.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;
export type TransactionItem = typeof transactionItems.$inferSelect;

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
