// Factory Pattern Implementation

import { Medicine } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

// Interface for Medicine objects
export interface IMedicine {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  stockQuantity: number;
  expiryDate?: Date | string;
  batchNumber?: string;
  supplierId?: number;
  
  // Methods common to all medicine types
  getDisplayPrice(): string;
  getStockStatus(): string;
  checkExpiry(): { warning: boolean; days: number };
  isLowOnStock(): boolean;
  calculateReorderQuantity(): number;
}

// Abstract base class for Medicine implementations
abstract class BaseMedicine implements IMedicine {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  stockQuantity: number;
  expiryDate?: Date | string;
  batchNumber?: string;
  supplierId?: number;
  
  constructor(medicine: Medicine) {
    this.id = medicine.id;
    this.name = medicine.name;
    this.description = medicine.description || undefined;
    this.category = medicine.category;
    this.price = medicine.price;
    this.stockQuantity = medicine.stockQuantity;
    this.expiryDate = medicine.expiryDate || undefined;
    this.batchNumber = medicine.batchNumber || undefined;
    this.supplierId = medicine.supplierId || undefined;
  }
  
  // Common implementation for all medicine types
  getDisplayPrice(): string {
    return formatCurrency(this.price);
  }
  
  getStockStatus(): string {
    if (this.stockQuantity <= 0) {
      return 'Out of Stock';
    } else if (this.stockQuantity < 5) {
      return 'Critical';
    } else if (this.stockQuantity < 10) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  }
  
  checkExpiry(): { warning: boolean; days: number } {
    if (!this.expiryDate) {
      return { warning: false, days: 0 };
    }
    
    const currentDate = new Date();
    const expiryDate = new Date(this.expiryDate);
    const differenceInTime = expiryDate.getTime() - currentDate.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return {
      warning: differenceInDays <= 30,
      days: differenceInDays
    };
  }
  
  isLowOnStock(): boolean {
    return this.stockQuantity < 10;
  }
  
  // Default implementation, can be overridden by specific medicine types
  calculateReorderQuantity(): number {
    return 20; // Default reorder quantity
  }
}

// Concrete class for Prescription Medicines
class PrescriptionMedicine extends BaseMedicine {
  requiresPrescription: boolean = true;
  
  constructor(medicine: Medicine) {
    super(medicine);
  }
  
  // Override to have specific behavior for prescription medicines
  calculateReorderQuantity(): number {
    // Special calculation for prescription medicines
    return Math.max(20, Math.ceil(this.stockQuantity * 0.5));
  }
}

// Concrete class for OTC (Over-the-Counter) Medicines
class OTCMedicine extends BaseMedicine {
  requiresPrescription: boolean = false;
  
  constructor(medicine: Medicine) {
    super(medicine);
  }
  
  // Override to have specific behavior for OTC medicines
  calculateReorderQuantity(): number {
    // OTC medications typically need larger quantities due to higher demand
    return Math.max(50, this.stockQuantity);
  }
}

// Concrete class for Antibiotic Medicines
class AntibioticMedicine extends PrescriptionMedicine {
  isControlled: boolean = true;
  
  constructor(medicine: Medicine) {
    super(medicine);
  }
  
  // Antibiotics have special handling requirements
  calculateReorderQuantity(): number {
    // More conservative ordering for antibiotics
    return Math.max(15, Math.ceil(this.stockQuantity * 0.3));
  }
}

// Concrete class for Painkillers
class PainkillerMedicine extends BaseMedicine {
  isControlled: boolean;
  requiresPrescription: boolean;
  
  constructor(medicine: Medicine) {
    super(medicine);
    
    // Some painkillers are controlled substances requiring prescriptions
    const category = medicine.category.toLowerCase();
    this.isControlled = category.includes('opioid') || category.includes('narcotic');
    this.requiresPrescription = this.isControlled;
  }
  
  // Override to have specific behavior for painkillers
  calculateReorderQuantity(): number {
    // Different calculation for controlled vs. non-controlled painkillers
    if (this.isControlled) {
      return Math.max(10, Math.ceil(this.stockQuantity * 0.2));
    } else {
      return Math.max(30, this.stockQuantity);
    }
  }
}

// Factory class to create appropriate medicine objects
export class MedicineFactory {
  static createMedicine(type: string, medicine: Medicine): IMedicine {
    switch (type.toLowerCase()) {
      case 'otc':
        return new OTCMedicine(medicine);
      case 'antibiotic':
        return new AntibioticMedicine(medicine);
      case 'painkiller':
        return new PainkillerMedicine(medicine);
      case 'prescription':
      default:
        return new PrescriptionMedicine(medicine);
    }
  }
}