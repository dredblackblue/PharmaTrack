import nodemailer from 'nodemailer';
import { User, Medicine, Order, Prescription } from '@shared/schema';
import { storage } from './storage';

// Email service setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Types for notification preferences
export interface NotificationPreferences {
  lowStock: boolean;
  expiringMedicines: boolean;
  orderUpdates: boolean;
  prescriptionCreated: boolean;
  dailyReports: boolean;
}

// Default notification preferences
export const defaultNotificationPreferences: NotificationPreferences = {
  lowStock: true,
  expiringMedicines: true,
  orderUpdates: true,
  prescriptionCreated: true,
  dailyReports: false,
};

// Get user notification preferences
export async function getUserNotificationPreferences(userId: number): Promise<NotificationPreferences> {
  const user = await storage.getUser(userId);
  if (!user || !user.notificationPreferences) {
    return defaultNotificationPreferences;
  }
  
  try {
    return JSON.parse(user.notificationPreferences) as NotificationPreferences;
  } catch (error) {
    console.error('Error parsing notification preferences:', error);
    return defaultNotificationPreferences;
  }
}

// Update user notification preferences
export async function updateUserNotificationPreferences(
  userId: number, 
  preferences: NotificationPreferences
): Promise<void> {
  const user = await storage.getUser(userId);
  if (!user) return;
  
  // In a real implementation, you would update the user record in the database
  // For now, we'll just log it
  console.log(`Updated notification preferences for user ${userId}:`, preferences);
}

// Send email notification
export async function sendEmailNotification(
  to: string, 
  subject: string, 
  html: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Pharmacy System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Notification for low stock medicines
export async function notifyLowStockMedicines(userIds?: number[]): Promise<void> {
  const lowStockMedicines = await storage.getLowStockMedicines();
  if (!lowStockMedicines.length) return;
  
  const users = await getAllUsersForNotification(userIds, 'lowStock');
  if (!users.length) return;
  
  const subject = 'Alert: Low Stock Medicines';
  const html = `
    <h2>Low Stock Medicines Alert</h2>
    <p>The following medicines are running low on stock and need to be reordered:</p>
    <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
      <tr style="background-color: #f2f2f2;">
        <th>Medicine Name</th>
        <th>Category</th>
        <th>Current Stock</th>
        <th>Status</th>
      </tr>
      ${lowStockMedicines.map(medicine => `
        <tr>
          <td>${medicine.name}</td>
          <td>${medicine.category}</td>
          <td>${medicine.stockQuantity}</td>
          <td><strong style="color: ${getStatusColor(medicine.stockStatus)};">${medicine.stockStatus}</strong></td>
        </tr>
      `).join('')}
    </table>
    <p>Please take appropriate action to restock these items.</p>
  `;
  
  for (const user of users) {
    if (user.email) {
      await sendEmailNotification(user.email, subject, html);
    }
  }
}

// Notification for expiring medicines
export async function notifyExpiringMedicines(daysThreshold: number = 30, userIds?: number[]): Promise<void> {
  const expiringMedicines = await storage.getMedicinesByExpiryDate(daysThreshold);
  if (!expiringMedicines.length) return;
  
  const users = await getAllUsersForNotification(userIds, 'expiringMedicines');
  if (!users.length) return;
  
  const subject = `Alert: Medicines Expiring Within ${daysThreshold} Days`;
  const html = `
    <h2>Medicine Expiry Alert</h2>
    <p>The following medicines are expiring within the next ${daysThreshold} days:</p>
    <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
      <tr style="background-color: #f2f2f2;">
        <th>Medicine Name</th>
        <th>Category</th>
        <th>Expiry Date</th>
        <th>Days Remaining</th>
      </tr>
      ${expiringMedicines.map(medicine => {
        const expiryDate = new Date(medicine.expiryDate as string);
        const today = new Date();
        const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        return `
          <tr>
            <td>${medicine.name}</td>
            <td>${medicine.category}</td>
            <td>${expiryDate.toLocaleDateString()}</td>
            <td><strong style="color: ${daysRemaining <= 7 ? 'red' : 'orange'};">${daysRemaining}</strong></td>
          </tr>
        `;
      }).join('')}
    </table>
    <p>Please review these items and take appropriate action.</p>
  `;
  
  for (const user of users) {
    if (user.email) {
      await sendEmailNotification(user.email, subject, html);
    }
  }
}

// Notification for order status update
export async function notifyOrderStatusUpdate(orderId: number): Promise<void> {
  const order = await storage.getOrder(orderId);
  if (!order) return;
  
  const supplier = await storage.getSupplier(order.supplierId);
  if (!supplier || !supplier.email) return;
  
  const orderItems = await storage.getOrderItems(orderId);
  
  const subject = `Order #${orderId} Status Update: ${order.status}`;
  const html = `
    <h2>Order Status Update</h2>
    <p>Order #${orderId} has been updated to: <strong>${order.status}</strong></p>
    <h3>Order Details:</h3>
    <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
    <p><strong>Expected Delivery:</strong> ${order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'Not specified'}</p>
    <p><strong>Status:</strong> ${order.status}</p>
    <p><strong>Notes:</strong> ${order.notes || 'None'}</p>
    
    <h3>Order Items:</h3>
    <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
      <tr style="background-color: #f2f2f2;">
        <th>Medicine</th>
        <th>Quantity</th>
      </tr>
      ${await Promise.all(orderItems.map(async item => {
        const medicine = await storage.getMedicine(item.medicineId);
        return `
          <tr>
            <td>${medicine?.name || `Medicine #${item.medicineId}`}</td>
            <td>${item.quantity}</td>
          </tr>
        `;
      }))}
    </table>
    
    <p>Thank you for your business.</p>
  `;
  
  await sendEmailNotification(supplier.email, subject, html);
  
  // Also notify admins and pharmacists
  const users = await getAllUsersForNotification(undefined, 'orderUpdates');
  for (const user of users) {
    if (user.email) {
      await sendEmailNotification(user.email, subject, html);
    }
  }
}

// Notification for new prescription
export async function notifyNewPrescription(prescriptionId: number): Promise<void> {
  const prescription = await storage.getPrescription(prescriptionId);
  if (!prescription) return;
  
  const patient = await storage.getPatient(prescription.patientId);
  if (!patient || !patient.email) return;
  
  const doctor = await storage.getDoctor(prescription.doctorId);
  const prescriptionItems = await storage.getPrescriptionItems(prescriptionId);
  
  const subject = `New Prescription #${prescription.prescriptionNumber}`;
  const html = `
    <h2>New Prescription Created</h2>
    <p>A new prescription has been created for you.</p>
    <h3>Prescription Details:</h3>
    <p><strong>Prescription #:</strong> ${prescription.prescriptionNumber}</p>
    <p><strong>Issue Date:</strong> ${new Date(prescription.issueDate).toLocaleDateString()}</p>
    <p><strong>Doctor:</strong> ${doctor?.name || 'Unknown'}</p>
    <p><strong>Notes:</strong> ${prescription.notes || 'None'}</p>
    
    <h3>Prescribed Medications:</h3>
    <table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%;">
      <tr style="background-color: #f2f2f2;">
        <th>Medicine</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
        <th>Quantity</th>
      </tr>
      ${await Promise.all(prescriptionItems.map(async item => {
        const medicine = await storage.getMedicine(item.medicineId);
        return `
          <tr>
            <td>${medicine?.name || `Medicine #${item.medicineId}`}</td>
            <td>${item.dosage}</td>
            <td>${item.frequency}</td>
            <td>${item.duration}</td>
            <td>${item.quantity}</td>
          </tr>
        `;
      }))}
    </table>
    
    <p>Please visit the pharmacy to collect your medications.</p>
  `;
  
  await sendEmailNotification(patient.email, subject, html);
  
  // Also notify pharmacists
  const users = await getAllUsersForNotification(undefined, 'prescriptionCreated');
  for (const user of users) {
    if (user.email && (user.role === 'pharmacist' || user.role === 'admin')) {
      await sendEmailNotification(user.email, subject, html);
    }
  }
}

// Utility functions
async function getAllUsersForNotification(
  userIds?: number[], 
  preferenceType?: keyof NotificationPreferences
): Promise<User[]> {
  // Get all users or specific users
  let users: User[];
  if (userIds && userIds.length > 0) {
    users = await Promise.all(userIds.map(id => storage.getUser(id)))
      .then(results => results.filter(user => user !== undefined) as User[]);
  } else {
    // In a real implementation, you would get all users from the database
    // For now, we'll fetch just admin and pharmacist users
    users = (await storage.getUsers()).filter(
      user => user.role === 'admin' || user.role === 'pharmacist'
    );
  }
  
  // Filter by notification preference if specified
  if (preferenceType) {
    return users.filter(user => {
      if (!user.notificationPreferences) return true; // Default to true if no preferences set
      
      try {
        const preferences = JSON.parse(user.notificationPreferences) as NotificationPreferences;
        return preferences[preferenceType];
      } catch (error) {
        console.error('Error parsing notification preferences:', error);
        return true; // Default to true if error parsing
      }
    });
  }
  
  return users;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'out_of_stock':
      return 'red';
    case 'critical':
      return 'orangered';
    case 'low_stock':
      return 'orange';
    case 'in_stock':
      return 'green';
    default:
      return 'black';
  }
}

// Schedule daily notifications check
export function scheduleDailyNotifications(): void {
  // In a production environment, you would use a proper scheduler like node-cron
  // For simplicity, we'll just call it once every 24 hours
  
  // Check for low stock medicines
  notifyLowStockMedicines();
  
  // Check for expiring medicines (30 days)
  notifyExpiringMedicines(30);
  
  // Schedule the next check
  setTimeout(scheduleDailyNotifications, 24 * 60 * 60 * 1000); // 24 hours
}