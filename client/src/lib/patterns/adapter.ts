// Adapter Pattern Implementation

// Payment Processor Interface
export interface IPaymentProcessor {
  processPayment(amount: number, paymentDetails: Record<string, any>): Promise<PaymentResult>;
  validatePayment(paymentDetails: Record<string, any>): boolean;
  getPaymentMethods(): string[];
}

// Standardized payment result
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amount: number;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Simulating the Stripe API interface
export class StripeGateway {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async chargeCard(params: {
    amount: number;
    currency: string;
    source: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    id: string;
    status: 'succeeded' | 'pending' | 'failed';
    amount: number;
    currency: string;
    created: number;
    error?: { message: string };
  }> {
    // This would be an actual API call to Stripe in a real implementation
    console.log('Simulating Stripe API call with API key:', this.apiKey);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate successful charge
    if (params.amount > 0 && params.source) {
      return {
        id: `ch_${Math.random().toString(36).substring(2, 15)}`,
        status: 'succeeded',
        amount: params.amount,
        currency: params.currency,
        created: Date.now()
      };
    }
    
    // Simulate error
    return {
      id: `ch_${Math.random().toString(36).substring(2, 15)}`,
      status: 'failed',
      amount: params.amount,
      currency: params.currency,
      created: Date.now(),
      error: { message: 'Your card was declined' }
    };
  }
  
  isCardValid(cardNumber: string, expMonth: number, expYear: number, cvc: string): boolean {
    // This would be a validation call to Stripe in a real implementation
    // Basic validation
    const isCardNumberValid = /^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''));
    const isCvcValid = /^\d{3,4}$/.test(cvc);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const isExpiryValid = 
      (expYear > currentYear) || 
      (expYear === currentYear && expMonth >= currentMonth);
    
    return isCardNumberValid && isCvcValid && isExpiryValid;
  }
  
  getSupportedCards(): string[] {
    return ['Visa', 'MasterCard', 'American Express', 'Discover', 'JCB'];
  }
}

// Simulating the PayPal API interface
export class PayPalClient {
  private clientId: string;
  private clientSecret: string;
  
  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }
  
  async createPayment(data: {
    amount: { total: string; currency: string };
    description: string;
  }): Promise<{
    id: string;
    state: 'approved' | 'created' | 'failed';
    transactions: Array<{ amount: { total: string; currency: string } }>;
    errorDetails?: Array<{ issue: string; description: string }>;
  }> {
    // This would be an actual API call to PayPal in a real implementation
    console.log('Simulating PayPal API call with credentials:', this.clientId, this.clientSecret);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate successful payment
    if (parseFloat(data.amount.total) > 0) {
      return {
        id: `PAY-${Math.random().toString(36).substring(2, 15)}`,
        state: 'approved',
        transactions: [{
          amount: {
            total: data.amount.total,
            currency: data.amount.currency
          }
        }]
      };
    }
    
    // Simulate error
    return {
      id: '',
      state: 'failed',
      transactions: [],
      errorDetails: [{ issue: 'PAYMENT_FAILED', description: 'Payment could not be processed' }]
    };
  }
  
  isConfigValid(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }
  
  getSupportedCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  }
}

// Adapter for Stripe Gateway
export class StripeAdapter implements IPaymentProcessor {
  private stripeGateway: StripeGateway;
  
  constructor(apiKey: string) {
    this.stripeGateway = new StripeGateway(apiKey);
  }
  
  async processPayment(amount: number, paymentDetails: Record<string, any>): Promise<PaymentResult> {
    try {
      // Convert our generic payment details to Stripe's expected format
      const stripeParams = {
        amount,
        currency: 'usd',
        source: paymentDetails.token || paymentDetails.cardNumber, // In reality, you'd use Stripe.js to get a token
        description: paymentDetails.description || 'Pharmacy purchase',
        metadata: paymentDetails.metadata
      };
      
      // Call the adaptee method
      const stripeResult = await this.stripeGateway.chargeCard(stripeParams);
      
      // Convert Stripe's response to our standard PaymentResult
      if (stripeResult.status === 'succeeded') {
        return {
          success: true,
          transactionId: stripeResult.id,
          amount: stripeResult.amount,
          message: 'Payment successful',
          metadata: {
            processor: 'stripe',
            timestamp: stripeResult.created
          }
        };
      } else {
        return {
          success: false,
          amount: stripeResult.amount,
          error: stripeResult.error?.message || 'Payment failed',
          metadata: {
            processor: 'stripe',
            timestamp: stripeResult.created
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        amount,
        error: error instanceof Error ? error.message : 'Stripe payment processing error',
        metadata: {
          processor: 'stripe'
        }
      };
    }
  }
  
  validatePayment(paymentDetails: Record<string, any>): boolean {
    return this.stripeGateway.isCardValid(
      paymentDetails.cardNumber,
      parseInt(paymentDetails.expMonth, 10),
      parseInt(paymentDetails.expYear, 10),
      paymentDetails.cvc
    );
  }
  
  getPaymentMethods(): string[] {
    return this.stripeGateway.getSupportedCards().map(card => `${card} card`);
  }
}

// Adapter for PayPal Client
export class PayPalAdapter implements IPaymentProcessor {
  private paypalClient: PayPalClient;
  
  constructor(clientId: string, clientSecret: string) {
    this.paypalClient = new PayPalClient(clientId, clientSecret);
  }
  
  async processPayment(amount: number, paymentDetails: Record<string, any>): Promise<PaymentResult> {
    try {
      // Check if the PayPal configuration is valid
      if (!this.paypalClient.isConfigValid()) {
        return {
          success: false,
          amount,
          error: 'Invalid PayPal configuration',
          metadata: {
            processor: 'paypal'
          }
        };
      }
      
      // Convert our generic payment details to PayPal's expected format
      const paypalParams = {
        amount: {
          total: (amount / 100).toFixed(2), // Convert cents to dollars and format
          currency: paymentDetails.currency || 'USD'
        },
        description: paymentDetails.description || 'Pharmacy purchase'
      };
      
      // Call the adaptee method
      const paypalResult = await this.paypalClient.createPayment(paypalParams);
      
      // Convert PayPal's response to our standard PaymentResult
      if (paypalResult.state === 'approved') {
        return {
          success: true,
          transactionId: paypalResult.id,
          amount,
          message: 'PayPal payment successful',
          metadata: {
            processor: 'paypal',
            currency: paypalResult.transactions[0]?.amount.currency
          }
        };
      } else {
        return {
          success: false,
          amount,
          error: paypalResult.errorDetails?.[0]?.description || 'PayPal payment failed',
          metadata: {
            processor: 'paypal'
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        amount,
        error: error instanceof Error ? error.message : 'PayPal payment processing error',
        metadata: {
          processor: 'paypal'
        }
      };
    }
  }
  
  validatePayment(paymentDetails: Record<string, any>): boolean {
    // For PayPal, we mainly check that the configuration is valid and
    // that the amount and currency are acceptable
    const isConfigValid = this.paypalClient.isConfigValid();
    const isCurrencySupported = this.paypalClient.getSupportedCurrencies()
      .includes((paymentDetails.currency || 'USD').toUpperCase());
    const isAmountValid = parseFloat(paymentDetails.amount || '0') > 0;
    
    return isConfigValid && isCurrencySupported && isAmountValid;
  }
  
  getPaymentMethods(): string[] {
    return ['PayPal', 'PayPal Credit'];
  }
}

// Payment Processor Factory (combines Factory pattern with Adapter pattern)
export class PaymentProcessorFactory {
  static createProcessor(type: string, config: Record<string, string>): IPaymentProcessor {
    switch (type.toLowerCase()) {
      case 'stripe':
        if (!config.apiKey) {
          throw new Error('Stripe API key is required');
        }
        return new StripeAdapter(config.apiKey);
      
      case 'paypal':
        if (!config.clientId || !config.clientSecret) {
          throw new Error('PayPal client ID and client secret are required');
        }
        return new PayPalAdapter(config.clientId, config.clientSecret);
      
      default:
        throw new Error(`Unsupported payment processor: ${type}`);
    }
  }
}