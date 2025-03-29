import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertMedicineSchema, 
  insertPatientSchema, 
  insertDoctorSchema, 
  insertPrescriptionSchema, 
  insertPrescriptionItemSchema,
  insertTransactionSchema,
  insertTransactionItemSchema,
  insertSupplierSchema,
  insertOrderSchema,
  insertOrderItemSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Medicines API
  app.get("/api/medicines", async (req, res) => {
    const medicines = await storage.getMedicines();
    res.json(medicines);
  });

  app.get("/api/medicines/low-stock", async (req, res) => {
    const medicines = await storage.getLowStockMedicines();
    res.json(medicines);
  });

  app.get("/api/medicines/expiring", async (req, res) => {
    const daysThreshold = parseInt(req.query.days as string) || 30;
    const medicines = await storage.getMedicinesByExpiryDate(daysThreshold);
    res.json(medicines);
  });

  app.get("/api/medicines/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const medicine = await storage.getMedicine(id);
    
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    
    res.json(medicine);
  });

  app.post("/api/medicines", async (req, res) => {
    try {
      const medicineData = insertMedicineSchema.parse(req.body);
      const medicine = await storage.createMedicine(medicineData);
      res.status(201).json(medicine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create medicine" });
    }
  });

  app.patch("/api/medicines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const medicineData = insertMedicineSchema.partial().parse(req.body);
      const medicine = await storage.updateMedicine(id, medicineData);
      
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      
      res.json(medicine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update medicine" });
    }
  });

  app.delete("/api/medicines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMedicine(id);
      
      if (!success) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete medicine" });
    }
  });

  // Patients API
  app.get("/api/patients", async (req, res) => {
    const patients = await storage.getPatients();
    res.json(patients);
  });

  app.get("/api/patients/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const patient = await storage.getPatient(id);
    
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    
    res.json(patient);
  });

  app.post("/api/patients", async (req, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.status(201).json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create patient" });
    }
  });

  app.patch("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patientData = insertPatientSchema.partial().parse(req.body);
      const patient = await storage.updatePatient(id, patientData);
      
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update patient" });
    }
  });

  app.delete("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePatient(id);
      
      if (!success) {
        return res.status(404).json({ message: "Patient not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete patient" });
    }
  });

  // Doctors API
  app.get("/api/doctors", async (req, res) => {
    const doctors = await storage.getDoctors();
    res.json(doctors);
  });

  app.get("/api/doctors/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const doctor = await storage.getDoctor(id);
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    
    res.json(doctor);
  });

  app.post("/api/doctors", async (req, res) => {
    try {
      const doctorData = insertDoctorSchema.parse(req.body);
      const doctor = await storage.createDoctor(doctorData);
      res.status(201).json(doctor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create doctor" });
    }
  });

  app.patch("/api/doctors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const doctorData = insertDoctorSchema.partial().parse(req.body);
      const doctor = await storage.updateDoctor(id, doctorData);
      
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      res.json(doctor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update doctor" });
    }
  });

  app.delete("/api/doctors/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDoctor(id);
      
      if (!success) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete doctor" });
    }
  });

  // Prescriptions API
  app.get("/api/prescriptions", async (req, res) => {
    const prescriptions = await storage.getPrescriptions();
    res.json(prescriptions);
  });

  app.get("/api/prescriptions/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const prescription = await storage.getPrescription(id);
    
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    
    // Get prescription items
    const items = await storage.getPrescriptionItems(id);
    
    res.json({ ...prescription, items });
  });

  app.get("/api/prescriptions/patient/:patientId", async (req, res) => {
    const patientId = parseInt(req.params.patientId);
    const prescriptions = await storage.getPrescriptionsByPatient(patientId);
    res.json(prescriptions);
  });

  app.post("/api/prescriptions", async (req, res) => {
    try {
      const prescriptionData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(prescriptionData);
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });

  app.post("/api/prescriptions/:id/items", async (req, res) => {
    try {
      const prescriptionId = parseInt(req.params.id);
      const prescription = await storage.getPrescription(prescriptionId);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      const itemData = insertPrescriptionItemSchema.parse({
        ...req.body,
        prescriptionId
      });
      
      const item = await storage.createPrescriptionItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create prescription item" });
    }
  });

  // Transactions API
  app.get("/api/transactions", async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  app.get("/api/transactions/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const transaction = await storage.getTransaction(id);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    
    // Get transaction items
    const items = await storage.getTransactionItems(id);
    
    res.json({ ...transaction, items });
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.post("/api/transactions/:id/items", async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      const itemData = insertTransactionItemSchema.parse({
        ...req.body,
        transactionId
      });
      
      const item = await storage.createTransactionItem(itemData);
      
      // Update medicine stock
      const medicine = await storage.getMedicine(itemData.medicineId);
      if (medicine) {
        await storage.updateMedicine(medicine.id, {
          stockQuantity: medicine.stockQuantity - itemData.quantity
        });
      }
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction item" });
    }
  });
  
  app.post("/api/transaction-items", async (req, res) => {
    try {
      const itemData = insertTransactionItemSchema.parse(req.body);
      const item = await storage.createTransactionItem(itemData);
      
      // Update medicine stock
      const medicine = await storage.getMedicine(itemData.medicineId);
      if (medicine) {
        await storage.updateMedicine(medicine.id, {
          stockQuantity: medicine.stockQuantity - itemData.quantity
        });
      }
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction item" });
    }
  });

  app.patch("/api/transactions/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['completed', 'pending', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const transaction = await storage.updateTransactionStatus(id, status);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update transaction status" });
    }
  });

  // Suppliers API
  app.get("/api/suppliers", async (req, res) => {
    const suppliers = await storage.getSuppliers();
    res.json(suppliers);
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const supplier = await storage.getSupplier(id);
    
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    
    res.json(supplier);
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, supplierData);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSupplier(id);
      
      if (!success) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Orders API
  app.get("/api/orders", async (req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.get("/api/orders/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const order = await storage.getOrder(id);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Get order items
    const items = await storage.getOrderItems(id);
    
    res.json({ ...order, items });
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.post("/api/orders/:id/items", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const itemData = insertOrderItemSchema.parse({
        ...req.body,
        orderId
      });
      
      const item = await storage.createOrderItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create order item" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // If order is delivered, update medicine stock quantities
      if (status === 'delivered') {
        const items = await storage.getOrderItems(id);
        
        for (const item of items) {
          const medicine = await storage.getMedicine(item.medicineId);
          if (medicine) {
            await storage.updateMedicine(medicine.id, {
              stockQuantity: medicine.stockQuantity + item.quantity
            });
          }
        }
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
