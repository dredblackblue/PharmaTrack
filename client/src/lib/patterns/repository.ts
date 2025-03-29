// Repository Pattern Implementation
// This pattern separates the logic for accessing data sources from business logic

import { apiRequest } from "@/lib/queryClient";
import { ApiCache } from "./singleton";

// Generic Repository interface
export interface IRepository<T, ID> {
  findAll(): Promise<T[]>;
  findById(id: ID): Promise<T | undefined>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, entity: Partial<T>): Promise<T | undefined>;
  delete(id: ID): Promise<boolean>;
}

// Abstract base repository implementing common functionality
export abstract class BaseRepository<T extends { id: ID }, ID> implements IRepository<T, ID> {
  protected baseUrl: string;
  protected cache: ApiCache;
  protected cacheTtl: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.cache = ApiCache.getInstance();
  }

  async findAll(): Promise<T[]> {
    const cacheKey = this.baseUrl;
    const cachedData = this.cache.get<T[]>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await apiRequest("GET", this.baseUrl);
      const data = await response.json();
      this.cache.set(cacheKey, data, this.cacheTtl);
      return data;
    } catch (error) {
      console.error(`Error fetching data from ${this.baseUrl}:`, error);
      throw error;
    }
  }

  async findById(id: ID): Promise<T | undefined> {
    const cacheKey = `${this.baseUrl}/${id}`;
    const cachedData = this.cache.get<T>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await apiRequest("GET", `${this.baseUrl}/${id}`);
      
      if (response.status === 404) {
        return undefined;
      }
      
      const data = await response.json();
      this.cache.set(cacheKey, data, this.cacheTtl);
      return data;
    } catch (error) {
      console.error(`Error fetching entity with ID ${id} from ${this.baseUrl}:`, error);
      throw error;
    }
  }

  async create(entity: Omit<T, 'id'>): Promise<T> {
    try {
      const response = await apiRequest("POST", this.baseUrl, entity);
      const data = await response.json();
      
      // Invalidate cache for collections
      this.cache.remove(this.baseUrl);
      
      return data;
    } catch (error) {
      console.error(`Error creating entity at ${this.baseUrl}:`, error);
      throw error;
    }
  }

  async update(id: ID, entity: Partial<T>): Promise<T | undefined> {
    try {
      const response = await apiRequest("PATCH", `${this.baseUrl}/${id}`, entity);
      
      if (response.status === 404) {
        return undefined;
      }
      
      const data = await response.json();
      
      // Update cache
      this.cache.remove(`${this.baseUrl}/${id}`);
      this.cache.remove(this.baseUrl);
      
      return data;
    } catch (error) {
      console.error(`Error updating entity with ID ${id} at ${this.baseUrl}:`, error);
      throw error;
    }
  }

  async delete(id: ID): Promise<boolean> {
    try {
      const response = await apiRequest("DELETE", `${this.baseUrl}/${id}`);
      
      if (response.status === 404) {
        return false;
      }
      
      // Invalidate cache
      this.cache.remove(`${this.baseUrl}/${id}`);
      this.cache.remove(this.baseUrl);
      
      return true;
    } catch (error) {
      console.error(`Error deleting entity with ID ${id} from ${this.baseUrl}:`, error);
      throw error;
    }
  }

  // Custom method to find with filters
  async findWithFilters(filters: Record<string, any>): Promise<T[]> {
    // Convert filters to query parameters
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `${this.baseUrl}?${queryParams.toString()}`;
    const cacheKey = url;
    const cachedData = this.cache.get<T[]>(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await apiRequest("GET", url);
      const data = await response.json();
      this.cache.set(cacheKey, data, this.cacheTtl);
      return data;
    } catch (error) {
      console.error(`Error fetching filtered data from ${url}:`, error);
      throw error;
    }
  }

  // Clear all cache for this repository
  clearCache(): void {
    const keys = this.cache.getKeys();
    
    keys.forEach(key => {
      if (key.startsWith(this.baseUrl)) {
        this.cache.remove(key);
      }
    });
  }

  // Set cache TTL for this repository
  setCacheTtl(ttl: number): void {
    this.cacheTtl = ttl;
  }
}

// Concrete Repositories

// Medicine Repository
export interface Medicine {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  stockQuantity: number;
  stockStatus: string;
  expiryDate?: Date | string;
  batchNumber?: string;
  supplierId?: number;
}

export class MedicineRepository extends BaseRepository<Medicine, number> {
  constructor() {
    super('/api/medicines');
  }

  // Additional medicine-specific methods
  async getLowStock(): Promise<Medicine[]> {
    return this.findWithFilters({ lowStock: true });
  }

  async getExpiringSoon(days: number = 30): Promise<Medicine[]> {
    return this.findWithFilters({ expiring: days });
  }

  async updateStock(id: number, quantity: number): Promise<Medicine | undefined> {
    return this.update(id, { stockQuantity: quantity });
  }

  async findByCategory(category: string): Promise<Medicine[]> {
    return this.findWithFilters({ category });
  }

  async findBySupplier(supplierId: number): Promise<Medicine[]> {
    return this.findWithFilters({ supplierId });
  }
}

// Patient Repository
export interface Patient {
  id: number;
  name: string;
  dateOfBirth?: Date | string;
  gender?: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  allergies?: string;
  medicalHistory?: string;
}

export class PatientRepository extends BaseRepository<Patient, number> {
  constructor() {
    super('/api/patients');
  }

  // Additional patient-specific methods
  async findByName(name: string): Promise<Patient[]> {
    return this.findWithFilters({ name });
  }

  async getPrescriptions(patientId: number): Promise<any[]> {
    try {
      const response = await apiRequest("GET", `/api/patients/${patientId}/prescriptions`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching prescriptions for patient ${patientId}:`, error);
      throw error;
    }
  }

  async getTransactions(patientId: number): Promise<any[]> {
    try {
      const response = await apiRequest("GET", `/api/patients/${patientId}/transactions`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching transactions for patient ${patientId}:`, error);
      throw error;
    }
  }
}

// Doctor Repository
export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  licenseNumber: string;
  contactNumber?: string;
  email?: string;
  address?: string;
}

export class DoctorRepository extends BaseRepository<Doctor, number> {
  constructor() {
    super('/api/doctors');
  }

  // Additional doctor-specific methods
  async findBySpecialization(specialization: string): Promise<Doctor[]> {
    return this.findWithFilters({ specialization });
  }

  async getPrescriptions(doctorId: number): Promise<any[]> {
    try {
      const response = await apiRequest("GET", `/api/doctors/${doctorId}/prescriptions`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching prescriptions for doctor ${doctorId}:`, error);
      throw error;
    }
  }
}

// Prescription Repository
export interface Prescription {
  id: number;
  prescriptionNumber: string;
  patientId: number;
  doctorId: number;
  issueDate: Date | string;
  notes?: string;
}

export class PrescriptionRepository extends BaseRepository<Prescription, number> {
  constructor() {
    super('/api/prescriptions');
  }

  // Additional prescription-specific methods
  async findByNumber(prescriptionNumber: string): Promise<Prescription | undefined> {
    const prescriptions = await this.findWithFilters({ prescriptionNumber });
    return prescriptions.length > 0 ? prescriptions[0] : undefined;
  }

  async findByPatient(patientId: number): Promise<Prescription[]> {
    return this.findWithFilters({ patientId });
  }

  async findByDoctor(doctorId: number): Promise<Prescription[]> {
    return this.findWithFilters({ doctorId });
  }

  async getItems(prescriptionId: number): Promise<any[]> {
    try {
      const response = await apiRequest("GET", `/api/prescriptions/${prescriptionId}/items`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching items for prescription ${prescriptionId}:`, error);
      throw error;
    }
  }

  async addItem(prescriptionId: number, item: any): Promise<any> {
    try {
      const response = await apiRequest("POST", `/api/prescriptions/${prescriptionId}/items`, item);
      
      // Invalidate cache
      this.cache.remove(`/api/prescriptions/${prescriptionId}/items`);
      
      return await response.json();
    } catch (error) {
      console.error(`Error adding item to prescription ${prescriptionId}:`, error);
      throw error;
    }
  }

  async removeItem(prescriptionId: number, itemId: number): Promise<boolean> {
    try {
      const response = await apiRequest("DELETE", `/api/prescriptions/${prescriptionId}/items/${itemId}`);
      
      // Invalidate cache
      this.cache.remove(`/api/prescriptions/${prescriptionId}/items`);
      
      return response.status === 200;
    } catch (error) {
      console.error(`Error removing item ${itemId} from prescription ${prescriptionId}:`, error);
      throw error;
    }
  }
}

// Repository Factory for creating repository instances
export class RepositoryFactory {
  private static repositories: Record<string, any> = {};

  static getMedicineRepository(): MedicineRepository {
    if (!this.repositories['medicine']) {
      this.repositories['medicine'] = new MedicineRepository();
    }
    return this.repositories['medicine'];
  }

  static getPatientRepository(): PatientRepository {
    if (!this.repositories['patient']) {
      this.repositories['patient'] = new PatientRepository();
    }
    return this.repositories['patient'];
  }

  static getDoctorRepository(): DoctorRepository {
    if (!this.repositories['doctor']) {
      this.repositories['doctor'] = new DoctorRepository();
    }
    return this.repositories['doctor'];
  }

  static getPrescriptionRepository(): PrescriptionRepository {
    if (!this.repositories['prescription']) {
      this.repositories['prescription'] = new PrescriptionRepository();
    }
    return this.repositories['prescription'];
  }
}

// Example usage:
// const medicineRepo = RepositoryFactory.getMedicineRepository();
// const medicines = await medicineRepo.findAll();
//
// const patientRepo = RepositoryFactory.getPatientRepository();
// const patient = await patientRepo.findById(1);