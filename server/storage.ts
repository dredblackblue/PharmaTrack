import { 
  users, type User, type InsertUser,
  medicines, type Medicine, type InsertMedicine,
  patients, type Patient, type InsertPatient,
  doctors, type Doctor, type InsertDoctor,
  prescriptions, type Prescription, type InsertPrescription,
  prescriptionItems, type PrescriptionItem, type InsertPrescriptionItem,
  transactions, type Transaction, type InsertTransaction,
  transactionItems, type TransactionItem, type InsertTransactionItem,
  suppliers, type Supplier, type InsertSupplier,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Medicines
  getMedicines(): Promise<Medicine[]>;
  getMedicine(id: number): Promise<Medicine | undefined>;
  getMedicineByName(name: string): Promise<Medicine | undefined>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  updateMedicine(id: number, medicine: Partial<InsertMedicine>): Promise<Medicine | undefined>;
  deleteMedicine(id: number): Promise<boolean>;
  getLowStockMedicines(): Promise<Medicine[]>;
  getMedicinesByExpiryDate(daysThreshold: number): Promise<Medicine[]>;
  
  // Patients
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;
  
  // Doctors
  getDoctors(): Promise<Doctor[]>;
  getDoctor(id: number): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined>;
  deleteDoctor(id: number): Promise<boolean>;
  
  // Prescriptions
  getPrescriptions(): Promise<Prescription[]>;
  getPrescription(id: number): Promise<Prescription | undefined>;
  getPrescriptionByNumber(prescriptionNumber: string): Promise<Prescription | undefined>;
  getPrescriptionsByPatient(patientId: number): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  deletePrescription(id: number): Promise<boolean>;
  
  // Prescription Items
  getPrescriptionItems(prescriptionId: number): Promise<PrescriptionItem[]>;
  createPrescriptionItem(prescriptionItem: InsertPrescriptionItem): Promise<PrescriptionItem>;
  deletePrescriptionItem(id: number): Promise<boolean>;
  
  // Transactions
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByPatient(patientId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: number, status: 'completed' | 'pending' | 'cancelled'): Promise<Transaction | undefined>;
  
  // Transaction Items
  getTransactionItems(transactionId: number): Promise<TransactionItem[]>;
  createTransactionItem(transactionItem: InsertTransactionItem): Promise<TransactionItem>;
  
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersBySupplier(supplierId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private medicines: Map<number, Medicine>;
  private patients: Map<number, Patient>;
  private doctors: Map<number, Doctor>;
  private prescriptions: Map<number, Prescription>;
  private prescriptionItems: Map<number, PrescriptionItem>;
  private transactions: Map<number, Transaction>;
  private transactionItems: Map<number, TransactionItem>;
  private suppliers: Map<number, Supplier>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  
  sessionStore: session.SessionStore;
  
  private userCurrentId: number;
  private medicineCurrentId: number;
  private patientCurrentId: number;
  private doctorCurrentId: number;
  private prescriptionCurrentId: number;
  private prescriptionItemCurrentId: number;
  private transactionCurrentId: number;
  private transactionItemCurrentId: number;
  private supplierCurrentId: number;
  private orderCurrentId: number;
  private orderItemCurrentId: number;

  constructor() {
    this.users = new Map();
    this.medicines = new Map();
    this.patients = new Map();
    this.doctors = new Map();
    this.prescriptions = new Map();
    this.prescriptionItems = new Map();
    this.transactions = new Map();
    this.transactionItems = new Map();
    this.suppliers = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    this.userCurrentId = 1;
    this.medicineCurrentId = 1;
    this.patientCurrentId = 1;
    this.doctorCurrentId = 1;
    this.prescriptionCurrentId = 1;
    this.prescriptionItemCurrentId = 1;
    this.transactionCurrentId = 1;
    this.transactionItemCurrentId = 1;
    this.supplierCurrentId = 1;
    this.orderCurrentId = 1;
    this.orderItemCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initial seed data for testing
    this.seedData();
  }
  
  private seedData() {
    // Add some initial suppliers
    const supplier1 = this.createSupplier({
      name: "MedSupply Inc.",
      contactPerson: "John Doe",
      contactNumber: "555-123-4567",
      email: "contact@medsupply.com",
      address: "123 Medical Dr, Health City, HC 12345",
      notes: "Preferred supplier for antibiotics"
    });
    
    const supplier2 = this.createSupplier({
      name: "PharmaCare Distributors",
      contactPerson: "Jane Smith",
      contactNumber: "555-987-6543",
      email: "info@pharmacare.com",
      address: "456 Pharma St, Medicine Town, MT 67890",
      notes: "Reliable supplier for all categories"
    });
    
    // Add some initial medicines
    this.createMedicine({
      name: "Amoxicillin 500mg",
      description: "Antibiotic used to treat a number of bacterial infections.",
      category: "Antibiotics",
      price: 1250, // $12.50
      stockQuantity: 12,
      expiryDate: new Date("2024-12-31"),
      batchNumber: "BTC-2023-45",
      supplierId: supplier1.id
    });
    
    this.createMedicine({
      name: "Lisinopril 10mg",
      description: "Used to treat high blood pressure and heart failure.",
      category: "Cardiovascular",
      price: 975, // $9.75
      stockQuantity: 8,
      expiryDate: new Date("2024-10-15"),
      batchNumber: "BTC-2023-38",
      supplierId: supplier2.id
    });
    
    this.createMedicine({
      name: "Metformin 850mg",
      description: "First-line medication for the treatment of type 2 diabetes.",
      category: "Antidiabetic",
      price: 850, // $8.50
      stockQuantity: 15,
      expiryDate: new Date("2025-02-28"),
      batchNumber: "BTC-2023-41",
      supplierId: supplier2.id
    });
    
    this.createMedicine({
      name: "Atorvastatin 20mg",
      description: "Lipid-lowering medication used to prevent cardiovascular disease.",
      category: "Lipid Lowering",
      price: 1100, // $11.00
      stockQuantity: 10,
      expiryDate: new Date("2024-11-30"),
      batchNumber: "BTC-2023-42",
      supplierId: supplier1.id
    });
    
    // Add some doctors
    const doctor1 = this.createDoctor({
      name: "Dr. Sarah Johnson",
      specialization: "General Practitioner",
      contactNumber: "555-111-2222",
      email: "dr.johnson@healthcare.com",
      address: "789 Medical Center, Health City, HC 12345",
      licenseNumber: "MD12345"
    });
    
    // Add some patients
    const patient1 = this.createPatient({
      name: "John Smith",
      dateOfBirth: new Date("1980-05-15"),
      gender: "Male",
      contactNumber: "555-333-4444",
      email: "john.smith@email.com",
      address: "101 Patient St, Health City, HC 12345",
      allergies: "Penicillin",
      medicalHistory: "Hypertension, Type 2 Diabetes"
    });
    
    const patient2 = this.createPatient({
      name: "Emma Johnson",
      dateOfBirth: new Date("1992-09-21"),
      gender: "Female",
      contactNumber: "555-555-6666",
      email: "emma.johnson@email.com",
      address: "202 Wellness Ave, Medicine Town, MT 67890",
      allergies: "None",
      medicalHistory: "Asthma"
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, dateJoined: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  // Medicines
  async getMedicines(): Promise<Medicine[]> {
    return Array.from(this.medicines.values());
  }
  
  async getMedicine(id: number): Promise<Medicine | undefined> {
    return this.medicines.get(id);
  }
  
  async getMedicineByName(name: string): Promise<Medicine | undefined> {
    return Array.from(this.medicines.values()).find(
      (medicine) => medicine.name.toLowerCase() === name.toLowerCase(),
    );
  }
  
  async createMedicine(insertMedicine: InsertMedicine): Promise<Medicine> {
    const id = this.medicineCurrentId++;
    let stockStatus: 'in_stock' | 'low_stock' | 'critical' | 'out_of_stock' = 'in_stock';
    
    if (insertMedicine.stockQuantity === 0) {
      stockStatus = 'out_of_stock';
    } else if (insertMedicine.stockQuantity <= 5) {
      stockStatus = 'critical';
    } else if (insertMedicine.stockQuantity <= 20) {
      stockStatus = 'low_stock';
    }
    
    const medicine: Medicine = { ...insertMedicine, id, stockStatus };
    this.medicines.set(id, medicine);
    return medicine;
  }
  
  async updateMedicine(id: number, medicine: Partial<InsertMedicine>): Promise<Medicine | undefined> {
    const existingMedicine = this.medicines.get(id);
    if (!existingMedicine) return undefined;
    
    const updatedMedicine = { ...existingMedicine, ...medicine };
    
    // Recalculate stock status
    if (updatedMedicine.stockQuantity !== undefined) {
      if (updatedMedicine.stockQuantity === 0) {
        updatedMedicine.stockStatus = 'out_of_stock';
      } else if (updatedMedicine.stockQuantity <= 5) {
        updatedMedicine.stockStatus = 'critical';
      } else if (updatedMedicine.stockQuantity <= 20) {
        updatedMedicine.stockStatus = 'low_stock';
      } else {
        updatedMedicine.stockStatus = 'in_stock';
      }
    }
    
    this.medicines.set(id, updatedMedicine);
    return updatedMedicine;
  }
  
  async deleteMedicine(id: number): Promise<boolean> {
    return this.medicines.delete(id);
  }
  
  async getLowStockMedicines(): Promise<Medicine[]> {
    return Array.from(this.medicines.values()).filter(
      (medicine) => medicine.stockStatus === 'low_stock' || medicine.stockStatus === 'critical'
    );
  }
  
  async getMedicinesByExpiryDate(daysThreshold: number): Promise<Medicine[]> {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    return Array.from(this.medicines.values()).filter(medicine => 
      medicine.expiryDate && medicine.expiryDate <= thresholdDate
    );
  }
  
  // Patients
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }
  
  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }
  
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.patientCurrentId++;
    const patient: Patient = { ...insertPatient, id };
    this.patients.set(id, patient);
    return patient;
  }
  
  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existingPatient = this.patients.get(id);
    if (!existingPatient) return undefined;
    
    const updatedPatient = { ...existingPatient, ...patient };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }
  
  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }
  
  // Doctors
  async getDoctors(): Promise<Doctor[]> {
    return Array.from(this.doctors.values());
  }
  
  async getDoctor(id: number): Promise<Doctor | undefined> {
    return this.doctors.get(id);
  }
  
  async createDoctor(insertDoctor: InsertDoctor): Promise<Doctor> {
    const id = this.doctorCurrentId++;
    const doctor: Doctor = { ...insertDoctor, id };
    this.doctors.set(id, doctor);
    return doctor;
  }
  
  async updateDoctor(id: number, doctor: Partial<InsertDoctor>): Promise<Doctor | undefined> {
    const existingDoctor = this.doctors.get(id);
    if (!existingDoctor) return undefined;
    
    const updatedDoctor = { ...existingDoctor, ...doctor };
    this.doctors.set(id, updatedDoctor);
    return updatedDoctor;
  }
  
  async deleteDoctor(id: number): Promise<boolean> {
    return this.doctors.delete(id);
  }
  
  // Prescriptions
  async getPrescriptions(): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values());
  }
  
  async getPrescription(id: number): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }
  
  async getPrescriptionByNumber(prescriptionNumber: string): Promise<Prescription | undefined> {
    return Array.from(this.prescriptions.values()).find(
      (prescription) => prescription.prescriptionNumber === prescriptionNumber,
    );
  }
  
  async getPrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(
      (prescription) => prescription.patientId === patientId,
    );
  }
  
  async createPrescription(insertPrescription: InsertPrescription): Promise<Prescription> {
    const id = this.prescriptionCurrentId++;
    const prescription: Prescription = { ...insertPrescription, id };
    this.prescriptions.set(id, prescription);
    return prescription;
  }
  
  async updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const existingPrescription = this.prescriptions.get(id);
    if (!existingPrescription) return undefined;
    
    const updatedPrescription = { ...existingPrescription, ...prescription };
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }
  
  async deletePrescription(id: number): Promise<boolean> {
    return this.prescriptions.delete(id);
  }
  
  // Prescription Items
  async getPrescriptionItems(prescriptionId: number): Promise<PrescriptionItem[]> {
    return Array.from(this.prescriptionItems.values()).filter(
      (item) => item.prescriptionId === prescriptionId,
    );
  }
  
  async createPrescriptionItem(insertPrescriptionItem: InsertPrescriptionItem): Promise<PrescriptionItem> {
    const id = this.prescriptionItemCurrentId++;
    const prescriptionItem: PrescriptionItem = { ...insertPrescriptionItem, id };
    this.prescriptionItems.set(id, prescriptionItem);
    return prescriptionItem;
  }
  
  async deletePrescriptionItem(id: number): Promise<boolean> {
    return this.prescriptionItems.delete(id);
  }
  
  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }
  
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getTransactionsByPatient(patientId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.patientId === patientId,
    );
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionCurrentId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      date: new Date(),
      status: 'pending'
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async updateTransactionStatus(id: number, status: 'completed' | 'pending' | 'cancelled'): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, status };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  // Transaction Items
  async getTransactionItems(transactionId: number): Promise<TransactionItem[]> {
    return Array.from(this.transactionItems.values()).filter(
      (item) => item.transactionId === transactionId,
    );
  }
  
  async createTransactionItem(insertTransactionItem: InsertTransactionItem): Promise<TransactionItem> {
    const id = this.transactionItemCurrentId++;
    const transactionItem: TransactionItem = { ...insertTransactionItem, id };
    this.transactionItems.set(id, transactionItem);
    return transactionItem;
  }
  
  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }
  
  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }
  
  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.supplierCurrentId++;
    const supplier: Supplier = { ...insertSupplier, id };
    this.suppliers.set(id, supplier);
    return supplier;
  }
  
  async updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existingSupplier = this.suppliers.get(id);
    if (!existingSupplier) return undefined;
    
    const updatedSupplier = { ...existingSupplier, ...supplier };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }
  
  async deleteSupplier(id: number): Promise<boolean> {
    return this.suppliers.delete(id);
  }
  
  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrdersBySupplier(supplierId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.supplierId === supplierId,
    );
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderCurrentId++;
    const order: Order = { 
      ...insertOrder, 
      id, 
      orderDate: new Date(),
      status: 'pending'
    };
    this.orders.set(id, order);
    return order;
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId,
    );
  }
  
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemCurrentId++;
    const orderItem: OrderItem = { ...insertOrderItem, id };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }
}

export const storage = new MemStorage();
