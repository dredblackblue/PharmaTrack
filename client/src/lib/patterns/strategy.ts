// Strategy Pattern Implementation

// PaymentStrategy interface
export interface PaymentStrategy {
  processPayment(amount: number, data: Record<string, any>): Promise<PaymentResult>;
  validatePaymentData(data: Record<string, any>): boolean;
  getName(): string;
  getIcon(): string;
  getRequiredFields(): string[];
}

// Payment result data structure
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  timestamp: Date;
  amount: number;
  currency: string;
  paymentMethod: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Credit Card Payment Strategy
export class CreditCardPaymentStrategy implements PaymentStrategy {
  getName(): string {
    return 'Credit Card';
  }
  
  getIcon(): string {
    return 'credit-card';
  }
  
  getRequiredFields(): string[] {
    return [
      'cardNumber',
      'cardholderName',
      'expiryMonth',
      'expiryYear',
      'cvc'
    ];
  }
  
  validatePaymentData(data: Record<string, any>): boolean {
    // Basic validation for credit card data
    if (!data.cardNumber || !data.cardholderName || !data.expiryMonth || !data.expiryYear || !data.cvc) {
      return false;
    }
    
    // Check card number (basic validation)
    const cardNumber = data.cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardNumber)) {
      return false;
    }
    
    // Check expiry date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const expYear = parseInt(data.expiryYear, 10);
    const expMonth = parseInt(data.expiryMonth, 10);
    
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false;
    }
    
    // Check CVC
    if (!/^\d{3,4}$/.test(data.cvc)) {
      return false;
    }
    
    return true;
  }
  
  async processPayment(amount: number, data: Record<string, any>): Promise<PaymentResult> {
    // In a real implementation, this would integrate with a payment gateway
    console.log('Processing credit card payment:', amount, data.cardNumber);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Determine if the payment should succeed or fail (for demo purposes)
    const shouldSucceed = amount > 0 && this.validatePaymentData(data);
    
    if (shouldSucceed) {
      return {
        success: true,
        transactionId: `CC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(),
        amount,
        currency: data.currency || 'USD',
        paymentMethod: 'Credit Card',
        metadata: {
          last4: data.cardNumber.slice(-4),
          cardType: this.detectCardType(data.cardNumber)
        }
      };
    } else {
      return {
        success: false,
        timestamp: new Date(),
        amount,
        currency: data.currency || 'USD',
        paymentMethod: 'Credit Card',
        error: 'Payment failed. Please check your card details and try again.'
      };
    }
  }
  
  private detectCardType(cardNumber: string): string {
    // Remove spaces and dashes
    cardNumber = cardNumber.replace(/[\s-]/g, '');
    
    // Check for card type based on patterns
    if (/^4/.test(cardNumber)) {
      return 'Visa';
    } else if (/^5[1-5]/.test(cardNumber)) {
      return 'MasterCard';
    } else if (/^3[47]/.test(cardNumber)) {
      return 'American Express';
    } else if (/^6(?:011|5)/.test(cardNumber)) {
      return 'Discover';
    } else {
      return 'Unknown';
    }
  }
}

// PayPal Payment Strategy
export class PayPalPaymentStrategy implements PaymentStrategy {
  getName(): string {
    return 'PayPal';
  }
  
  getIcon(): string {
    return 'paypal';
  }
  
  getRequiredFields(): string[] {
    return [
      'email',
      'password'
    ];
  }
  
  validatePaymentData(data: Record<string, any>): boolean {
    // Basic validation for PayPal data
    if (!data.email || !data.password) {
      return false;
    }
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return false;
    }
    
    // Check password (basic validation)
    if (data.password.length < 6) {
      return false;
    }
    
    return true;
  }
  
  async processPayment(amount: number, data: Record<string, any>): Promise<PaymentResult> {
    // In a real implementation, this would integrate with PayPal API
    console.log('Processing PayPal payment:', amount, data.email);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Determine if the payment should succeed or fail (for demo purposes)
    const shouldSucceed = amount > 0 && this.validatePaymentData(data);
    
    if (shouldSucceed) {
      return {
        success: true,
        transactionId: `PP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(),
        amount,
        currency: data.currency || 'USD',
        paymentMethod: 'PayPal',
        metadata: {
          email: data.email
        }
      };
    } else {
      return {
        success: false,
        timestamp: new Date(),
        amount,
        currency: data.currency || 'USD',
        paymentMethod: 'PayPal',
        error: 'PayPal payment failed. Please check your credentials and try again.'
      };
    }
  }
}

// Bank Transfer Payment Strategy
export class BankTransferPaymentStrategy implements PaymentStrategy {
  getName(): string {
    return 'Bank Transfer';
  }
  
  getIcon(): string {
    return 'bank';
  }
  
  getRequiredFields(): string[] {
    return [
      'accountName',
      'accountNumber',
      'routingNumber',
      'bankName'
    ];
  }
  
  validatePaymentData(data: Record<string, any>): boolean {
    // Basic validation for bank transfer data
    if (!data.accountName || !data.accountNumber || !data.routingNumber || !data.bankName) {
      return false;
    }
    
    // Check account number (basic validation)
    if (!/^\d{8,17}$/.test(data.accountNumber)) {
      return false;
    }
    
    // Check routing number (basic validation for US)
    if (!/^\d{9}$/.test(data.routingNumber)) {
      return false;
    }
    
    return true;
  }
  
  async processPayment(amount: number, data: Record<string, any>): Promise<PaymentResult> {
    // In a real implementation, this would integrate with a bank API
    console.log('Processing bank transfer payment:', amount, data.accountNumber);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Determine if the payment should succeed or fail (for demo purposes)
    const shouldSucceed = amount > 0 && this.validatePaymentData(data);
    
    if (shouldSucceed) {
      return {
        success: true,
        transactionId: `BT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(),
        amount,
        currency: data.currency || 'USD',
        paymentMethod: 'Bank Transfer',
        metadata: {
          bankName: data.bankName,
          last4: data.accountNumber.slice(-4)
        }
      };
    } else {
      return {
        success: false,
        timestamp: new Date(),
        amount,
        currency: data.currency || 'USD',
        paymentMethod: 'Bank Transfer',
        error: 'Bank transfer failed. Please check your bank details and try again.'
      };
    }
  }
}

// Insurance Payment Strategy
export class InsurancePaymentStrategy implements PaymentStrategy {
  getName(): string {
    return 'Insurance';
  }
  
  getIcon(): string {
    return 'shield';
  }
  
  getRequiredFields(): string[] {
    return [
      'insuranceProvider',
      'policyNumber',
      'memberName',
      'memberId',
      'groupNumber'
    ];
  }
  
  validatePaymentData(data: Record<string, any>): boolean {
    // Basic validation for insurance data
    if (!data.insuranceProvider || !data.policyNumber || !data.memberName || !data.memberId) {
      return false;
    }
    
    // Additional validation could be added here
    
    return true;
  }
  
  async processPayment(amount: number, data: Record<string, any>): Promise<PaymentResult> {
    // In a real implementation, this would integrate with insurance provider APIs
    console.log('Processing insurance payment:', amount, data.policyNumber);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Determine if the payment should succeed or fail (for demo purposes)
    const shouldSucceed = amount > 0 && this.validatePaymentData(data);
    
    // Calculate coverage amount (for demo purposes)
    const coveragePercentage = data.coveragePercentage || 80;
    const coveredAmount = (amount * coveragePercentage) / 100;
    const remainingAmount = amount - coveredAmount;
    
    if (shouldSucceed) {
      return {
        success: true,
        transactionId: `INS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date(),
        amount: coveredAmount,
        currency: data.currency || 'USD',
        paymentMethod: 'Insurance',
        metadata: {
          provider: data.insuranceProvider,
          policyNumber: data.policyNumber,
          coveragePercentage,
          coveredAmount,
          remainingAmount
        }
      };
    } else {
      return {
        success: false,
        timestamp: new Date(),
        amount,
        currency: data.currency || 'USD',
        paymentMethod: 'Insurance',
        error: 'Insurance coverage verification failed. Please check your policy details and try again.'
      };
    }
  }
}

// Payment Processor that uses the strategy pattern
export class PaymentProcessor {
  private strategy: PaymentStrategy;
  
  constructor(strategy: PaymentStrategy) {
    this.strategy = strategy;
  }
  
  setStrategy(strategy: PaymentStrategy): void {
    this.strategy = strategy;
  }
  
  getStrategy(): PaymentStrategy {
    return this.strategy;
  }
  
  async processPayment(amount: number, data: Record<string, any>): Promise<PaymentResult> {
    if (!this.validatePaymentData(data)) {
      return {
        success: false,
        timestamp: new Date(),
        amount,
        currency: data.currency || 'USD',
        paymentMethod: this.strategy.getName(),
        error: 'Invalid payment data. Please check your information and try again.'
      };
    }
    
    return this.strategy.processPayment(amount, data);
  }
  
  validatePaymentData(data: Record<string, any>): boolean {
    return this.strategy.validatePaymentData(data);
  }
  
  getRequiredFields(): string[] {
    return this.strategy.getRequiredFields();
  }
}

// Factory to create payment strategies
export class PaymentStrategyFactory {
  static createStrategy(type: string): PaymentStrategy {
    switch (type.toLowerCase()) {
      case 'credit-card':
      case 'creditcard':
      case 'card':
        return new CreditCardPaymentStrategy();
        
      case 'paypal':
        return new PayPalPaymentStrategy();
        
      case 'bank-transfer':
      case 'banktransfer':
      case 'bank':
        return new BankTransferPaymentStrategy();
        
      case 'insurance':
        return new InsurancePaymentStrategy();
        
      default:
        throw new Error(`Unsupported payment strategy: ${type}`);
    }
  }
}

// Example usage:
// const creditCardStrategy = PaymentStrategyFactory.createStrategy('credit-card');
// const paymentProcessor = new PaymentProcessor(creditCardStrategy);
// 
// // Process a payment
// const paymentResult = await paymentProcessor.processPayment(100, {
//   cardNumber: '4111111111111111',
//   cardholderName: 'John Doe',
//   expiryMonth: '12',
//   expiryYear: '2024',
//   cvc: '123'
// });
// 
// console.log(paymentResult);
// 
// // Switch to a different payment strategy
// const paypalStrategy = PaymentStrategyFactory.createStrategy('paypal');
// paymentProcessor.setStrategy(paypalStrategy);
// 
// // Process another payment with the new strategy
// const paypalResult = await paymentProcessor.processPayment(150, {
//   email: 'john.doe@example.com',
//   password: 'secure-password'
// });
// 
// console.log(paypalResult);