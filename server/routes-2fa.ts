import express, { Express, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { 
  enableTwoFactorAuth, 
  verifyTwoFactorToken, 
  disableTwoFactorAuth,
  sendEmailVerificationCode,
  verifyEmailCode
} from './two-factor-auth';
import { 
  getUserNotificationPreferences, 
  updateUserNotificationPreferences,
  scheduleDailyNotifications,
  notifyLowStockMedicines,
  notifyExpiringMedicines,
  notifyOrderStatusUpdate,
  notifyNewPrescription
} from './notifications';

// Start scheduled notifications
scheduleDailyNotifications();

export function setupTwoFactorAndNotifications(app: Express) {
  // Two-factor authentication routes
  app.get('/api/2fa/status', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      enabled: user.twoFactorEnabled,
      verified: user.twoFactorVerified
    });
  });

  app.post('/api/2fa/enable', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { secret, url } = await enableTwoFactorAuth(req.user.id);
      res.json({ secret, url });
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/2fa/verify', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const schema = z.object({
      token: z.string().min(6).max(6)
    });

    try {
      const { token } = schema.parse(req.body);
      const verified = await verifyTwoFactorToken(req.user.id, token);
      
      if (verified) {
        res.json({ success: true });
      } else {
        res.status(400).json({ message: 'Invalid token' });
      }
    } catch (error: any) {
      console.error('Error verifying 2FA token:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/2fa/disable', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      await disableTwoFactorAuth(req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/2fa/email/send-code', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const code = await sendEmailVerificationCode(req.user.id);
      // In a real implementation, we should not send the code back to the client
      // It's only for demonstration purposes
      res.json({ success: true, code });
    } catch (error: any) {
      console.error('Error sending email code:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/2fa/email/verify', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const schema = z.object({
      code: z.string().min(6).max(6),
      expectedCode: z.string().min(6).max(6)
    });

    try {
      const { code, expectedCode } = schema.parse(req.body);
      const verified = verifyEmailCode(code, expectedCode);
      
      if (verified) {
        res.json({ success: true });
      } else {
        res.status(400).json({ message: 'Invalid code' });
      }
    } catch (error: any) {
      console.error('Error verifying email code:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Notification preferences routes
  app.get('/api/notifications/preferences', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const preferences = await getUserNotificationPreferences(req.user.id);
      res.json(preferences);
    } catch (error: any) {
      console.error('Error getting notification preferences:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/notifications/preferences', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const schema = z.object({
      lowStock: z.boolean(),
      expiringMedicines: z.boolean(),
      orderUpdates: z.boolean(),
      prescriptionCreated: z.boolean(),
      dailyReports: z.boolean()
    });

    try {
      const preferences = schema.parse(req.body);
      await updateUserNotificationPreferences(req.user.id, preferences);
      
      // Update the user record
      await storage.updateUserNotificationPreferences(req.user.id, JSON.stringify(preferences));
      
      res.json({ success: true, preferences });
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Manual notification triggers (for admin/testing)
  app.post('/api/notifications/trigger/low-stock', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Only admin or pharmacist can trigger notifications
    if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    try {
      await notifyLowStockMedicines();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error triggering low stock notification:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/notifications/trigger/expiring', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Only admin or pharmacist can trigger notifications
    if (req.user.role !== 'admin' && req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const schema = z.object({
      daysThreshold: z.number().positive().default(30)
    });

    try {
      const { daysThreshold } = schema.parse(req.body);
      await notifyExpiringMedicines(daysThreshold);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error triggering expiring medicines notification:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Hook into other API endpoints to trigger notifications
  
  // Order status update notification
  app.post('/api/orders/:id/status', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const schema = z.object({
      status: z.string()
    });

    try {
      const { status } = schema.parse(req.body);
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Trigger notification
      await notifyOrderStatusUpdate(orderId);
      
      res.json(updatedOrder);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // New prescription notification
  app.post('/api/prescriptions', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const prescription = await storage.createPrescription(req.body);
      
      // Trigger notification
      await notifyNewPrescription(prescription.id);
      
      res.status(201).json(prescription);
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      res.status(400).json({ message: error.message });
    }
  });
}