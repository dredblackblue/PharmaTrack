import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Medicine } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OrderModal } from "@/components/inventory/order-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { Edit, MoreVertical, AlertTriangle, ShoppingCart, Filter, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MedicineFactory, RepositoryFactory } from "@/lib/patterns";
import { IMedicine } from "@/lib/patterns/factory";
import { NotificationCenter, NotificationType, Notification } from "@/lib/patterns/observer";
import { useToast } from "@/hooks/use-toast";

export default function MedicineList() {
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [displayMedicines, setDisplayMedicines] = useState<IMedicine[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Get the notification center singleton
  const notificationCenter = NotificationCenter.getInstance();
  
  // Get the medicine repository
  const medicineRepository = RepositoryFactory.getMedicineRepository();
  
  // Fetch medicines
  const { data: medicines, isLoading, error } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });
  
  // Process medicines with the factory pattern when data is loaded
  useEffect(() => {
    if (medicines) {
      // Process medicines through the factory
      const processedMedicines = medicines.map(medicine => {
        // Determine medicine type based on category
        const type = getMedicineType(medicine.category);
        // Create medicine object using the factory
        return MedicineFactory.createMedicine(type, medicine);
      });
      
      setDisplayMedicines(processedMedicines);
      
      // Check for critical stock or expiry and send notifications
      processedMedicines.forEach(medicine => {
        const stockStatus = medicine.getStockStatus();
        const expiryCheck = medicine.checkExpiry();
        
        // Send notifications for critical stock
        if (stockStatus === 'Critical' || stockStatus === 'Out of Stock') {
          notificationCenter.notify(new Notification(
            NotificationType.LOW_STOCK,
            'Critical Stock Alert',
            `${medicine.name} is running low on stock.`,
            'high',
            { medicineId: medicine.id, stockStatus }
          ));
          
          // Show toast for critical stock
          toast({
            title: 'Low Stock Alert',
            description: `${medicine.name} is running low on stock.`,
            variant: 'destructive'
          });
        }
        
        // Send notifications for expiring medicines
        if (expiryCheck.warning) {
          notificationCenter.notify(new Notification(
            NotificationType.EXPIRY_WARNING,
            'Expiry Warning',
            `${medicine.name} will expire in ${expiryCheck.days} days.`,
            expiryCheck.days <= 7 ? 'high' : 'medium',
            { medicineId: medicine.id, daysToExpiry: expiryCheck.days }
          ));
        }
      });
    }
  }, [medicines, toast]);
  
  // Filter medicines when category filter changes
  useEffect(() => {
    if (!displayMedicines.length) return;
    
    if (filterCategory) {
      setDisplayMedicines(prevMedicines => 
        prevMedicines.filter(med => med.category.toLowerCase() === filterCategory.toLowerCase())
      );
    } else if (medicines) {
      // Reset to all medicines
      const processedMedicines = medicines.map(medicine => {
        const type = getMedicineType(medicine.category);
        return MedicineFactory.createMedicine(type, medicine);
      });
      setDisplayMedicines(processedMedicines);
    }
  }, [filterCategory, medicines]);
  
  const handleOrder = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsOrderModalOpen(true);
  };
  
  const getMedicineType = (category: string): string => {
    // Map categories to medicine types
    category = category.toLowerCase();
    
    if (category.includes('antibiotic')) return 'antibiotic';
    if (category.includes('pain') || category.includes('analgesic')) return 'painkiller';
    if (category.includes('otc') || category.includes('over-the-counter')) return 'otc';
    
    // Default to prescription if not matched
    return 'prescription';
  };
  
  // Get status badge based on stock status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Low Stock':
        return (
          <Badge variant="outline" className="bg-warning bg-opacity-10 text-warning border-warning">
            Low Stock
          </Badge>
        );
      case 'Critical':
        return (
          <Badge variant="outline" className="bg-error bg-opacity-10 text-error border-error">
            Critical
          </Badge>
        );
      case 'Out of Stock':
        return (
          <Badge variant="outline" className="bg-error bg-opacity-10 text-error border-error">
            Out of Stock
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-success bg-opacity-10 text-success border-success">
            In Stock
          </Badge>
        );
    }
  };
  
  // Extract unique categories for filter
  const categoriesSet = new Set<string>();
  medicines?.forEach(med => categoriesSet.add(med.category));
  const categories = Array.from(categoriesSet);
  
  return (
    <>
      <Card>
        <CardHeader className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="text-lg font-bold text-neutral-400">Medicines Inventory</CardTitle>
            <CardDescription className="text-neutral-300 mt-1">
              {!isLoading && !error && `Showing ${displayMedicines.length} medicines`}
            </CardDescription>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-0">
            {/* Filter by category */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  {filterCategory || 'Filter by Category'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterCategory(null)}>
                  All Categories
                </DropdownMenuItem>
                {categories.map(category => (
                  <DropdownMenuItem key={category} onClick={() => setFilterCategory(category)}>
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        
        {/* Stock Status Tabs */}
        <div className="p-4 border-b">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="low">Low Stock</TabsTrigger>
              <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
              <TabsTrigger value="in-stock">In Stock</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-medium text-neutral-300">Name</TableHead>
                  <TableHead className="font-medium text-neutral-300">Category</TableHead>
                  <TableHead className="font-medium text-neutral-300">Price</TableHead>
                  <TableHead className="font-medium text-neutral-300">Stock</TableHead>
                  <TableHead className="font-medium text-neutral-300">Status</TableHead>
                  <TableHead className="font-medium text-neutral-300">Expiry Date</TableHead>
                  <TableHead className="font-medium text-neutral-300">Batch #</TableHead>
                  <TableHead className="text-right font-medium text-neutral-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {isLoading ? (
                  // Skeleton loading state
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-neutral-400">
                      Failed to load medicines
                    </TableCell>
                  </TableRow>
                ) : displayMedicines.length > 0 ? (
                  displayMedicines.map(medicine => {
                    const expiryCheck = medicine.checkExpiry();
                    const stockStatus = medicine.getStockStatus();
                    const medicineData = medicines?.find(m => m.id === medicine.id);
                    
                    if (!medicineData) return null;
                    
                    return (
                      <TableRow key={medicine.id} className="hover:bg-neutral-50">
                        <TableCell className="font-medium text-neutral-400">{medicine.name}</TableCell>
                        <TableCell className="text-neutral-300">{medicine.category}</TableCell>
                        <TableCell className="text-neutral-400">{medicine.getDisplayPrice()}</TableCell>
                        <TableCell className="text-neutral-400">{medicineData.stockQuantity} units</TableCell>
                        <TableCell>{getStatusBadge(stockStatus)}</TableCell>
                        <TableCell>
                          {medicineData.expiryDate ? (
                            <div className="flex items-center">
                              {expiryCheck.warning && <AlertTriangle className="h-4 w-4 text-error mr-1" />}
                              <span className={expiryCheck.warning ? "text-error" : "text-neutral-300"}>
                                {new Date(medicineData.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-300">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="text-neutral-300">{medicineData.batchNumber || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="flex items-center cursor-pointer"
                                onClick={() => handleOrder(medicineData)}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Order
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6 text-neutral-300">
                      No medicines found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {selectedMedicine && (
        <OrderModal 
          isOpen={isOrderModalOpen} 
          onClose={() => setIsOrderModalOpen(false)} 
          medicine={selectedMedicine} 
        />
      )}
    </>
  );
}
