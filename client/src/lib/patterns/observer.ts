// Observer Pattern Implementation

// Notification types for the pharmacy system
export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  EXPIRY_WARNING = 'EXPIRY_WARNING',
  NEW_ORDER = 'NEW_ORDER',
  ORDER_STATUS_CHANGE = 'ORDER_STATUS_CHANGE',
  PRESCRIPTION_FILLED = 'PRESCRIPTION_FILLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

// Priority levels for notifications
export type NotificationPriority = 'low' | 'medium' | 'high';

// Notification data structure
export class Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: Date;
  read: boolean;
  metadata?: Record<string, any>;
  
  constructor(
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = 'medium',
    metadata?: Record<string, any>
  ) {
    this.id = this.generateId();
    this.type = type;
    this.title = title;
    this.message = message;
    this.priority = priority;
    this.timestamp = new Date();
    this.read = false;
    this.metadata = metadata;
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  markAsRead(): void {
    this.read = true;
  }
  
  markAsUnread(): void {
    this.read = false;
  }
}

// Observer interface
export interface Observer {
  update(notification: Notification): void;
}

// Subject interface
export interface Subject {
  attach(observer: Observer): void;
  detach(observer: Observer): void;
  notify(notification: Notification): void;
}

// Concrete observers
export class StockManager implements Observer {
  update(notification: Notification): void {
    if (notification.type === NotificationType.LOW_STOCK) {
      console.log(`[StockManager] Processing low stock notification: ${notification.message}`);
      // In a real app, this would trigger stock replenishment processes
    }
  }
}

export class ExpiryManager implements Observer {
  update(notification: Notification): void {
    if (notification.type === NotificationType.EXPIRY_WARNING) {
      console.log(`[ExpiryManager] Processing expiry warning: ${notification.message}`);
      // In a real app, this would update expiry tracking systems
    }
  }
}

export class OrderProcessor implements Observer {
  update(notification: Notification): void {
    if (notification.type === NotificationType.NEW_ORDER || 
        notification.type === NotificationType.ORDER_STATUS_CHANGE) {
      console.log(`[OrderProcessor] Processing order notification: ${notification.message}`);
      // In a real app, this would update order processing systems
    }
  }
}

export class PharmacyDashboard implements Observer {
  update(notification: Notification): void {
    // Dashboard is interested in all notifications for display
    console.log(`[Dashboard] New notification: ${notification.title} - ${notification.message}`);
    // In a real app, this would update the UI with new notifications
  }
}

// NotificationCenter (Subject implementation) - Singleton
export class NotificationCenter implements Subject {
  private static instance: NotificationCenter;
  private observers: Observer[] = [];
  private notifications: Notification[] = [];
  private maxNotifications: number = 100;
  
  private constructor() {
    // Private constructor to prevent direct construction calls with the `new` operator
  }
  
  // Get the singleton instance
  public static getInstance(): NotificationCenter {
    if (!NotificationCenter.instance) {
      NotificationCenter.instance = new NotificationCenter();
    }
    
    return NotificationCenter.instance;
  }
  
  // Attach an observer
  attach(observer: Observer): void {
    const isExist = this.observers.includes(observer);
    if (!isExist) {
      this.observers.push(observer);
      console.log('NotificationCenter: Attached an observer.');
    }
  }
  
  // Detach an observer
  detach(observer: Observer): void {
    const observerIndex = this.observers.indexOf(observer);
    if (observerIndex !== -1) {
      this.observers.splice(observerIndex, 1);
      console.log('NotificationCenter: Detached an observer.');
    }
  }
  
  // Notify all observers about an event
  notify(notification: Notification): void {
    // Store the notification
    this.addNotification(notification);
    
    // Notify all observers
    console.log('NotificationCenter: Notifying observers...');
    for (const observer of this.observers) {
      observer.update(notification);
    }
  }
  
  // Get all notifications
  getNotifications(): Notification[] {
    return [...this.notifications];
  }
  
  // Get unread notifications
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(notification => !notification.read);
  }
  
  // Get notifications by type
  getNotificationsByType(type: NotificationType): Notification[] {
    return this.notifications.filter(notification => notification.type === type);
  }
  
  // Get notifications by priority
  getNotificationsByPriority(priority: NotificationPriority): Notification[] {
    return this.notifications.filter(notification => notification.priority === priority);
  }
  
  // Mark a notification as read
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.markAsRead();
    }
  }
  
  // Mark all notifications as read
  markAllAsRead(): void {
    this.notifications.forEach(notification => notification.markAsRead());
  }
  
  // Add a notification to the store
  private addNotification(notification: Notification): void {
    this.notifications.unshift(notification);
    
    // Limit the number of stored notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }
  }
  
  // Clear all notifications
  clearNotifications(): void {
    this.notifications = [];
  }
  
  // Remove a specific notification
  removeNotification(notificationId: string): void {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
    }
  }
}

// Example usage:
// const notificationCenter = NotificationCenter.getInstance();
// 
// // Create observers
// const stockManager = new StockManager();
// const dashboard = new PharmacyDashboard();
// 
// // Attach observers
// notificationCenter.attach(stockManager);
// notificationCenter.attach(dashboard);
// 
// // Create and send a notification
// const lowStockNotification = new Notification(
//   NotificationType.LOW_STOCK,
//   'Low Stock Alert',
//   'Paracetamol 500mg is running low on stock.',
//   'high',
//   { medicineId: 123, currentStock: 5 }
// );
// 
// notificationCenter.notify(lowStockNotification);