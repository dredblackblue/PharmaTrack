import { useState } from "react";
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
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, calculateExpiryDays } from "@/lib/utils";
import { Edit, MoreVertical, AlertTriangle, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MedicineList() {
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  // Fetch medicines
  const { data: medicines, isLoading, error } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });
  
  const handleOrder = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsOrderModalOpen(true);
  };
  
  // Get status badge based on stock status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'low_stock':
        return (
          <Badge variant="outline" className="bg-warning bg-opacity-10 text-warning border-warning">
            Low Stock
          </Badge>
        );
      case 'critical':
        return (
          <Badge variant="outline" className="bg-error bg-opacity-10 text-error border-error">
            Critical
          </Badge>
        );
      case 'out_of_stock':
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
  
  return (
    <>
      <Card>
        <CardHeader className="p-4 border-b flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-neutral-400">Medicines Inventory</CardTitle>
        </CardHeader>
        
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
                ) : medicines && medicines.length > 0 ? (
                  medicines.map(medicine => {
                    const expiry = medicine.expiryDate ? calculateExpiryDays(medicine.expiryDate) : null;
                    
                    return (
                      <TableRow key={medicine.id} className="hover:bg-neutral-50">
                        <TableCell className="font-medium text-neutral-400">{medicine.name}</TableCell>
                        <TableCell className="text-neutral-300">{medicine.category}</TableCell>
                        <TableCell className="text-neutral-400">{formatCurrency(medicine.price)}</TableCell>
                        <TableCell className="text-neutral-400">{medicine.stockQuantity} units</TableCell>
                        <TableCell>{getStatusBadge(medicine.stockStatus)}</TableCell>
                        <TableCell>
                          {medicine.expiryDate ? (
                            <div className="flex items-center">
                              {expiry && expiry.critical && <AlertTriangle className="h-4 w-4 text-error mr-1" />}
                              <span className={expiry && expiry.critical ? "text-error" : "text-neutral-300"}>
                                {new Date(medicine.expiryDate).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-300">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="text-neutral-300">{medicine.batchNumber || 'N/A'}</TableCell>
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
                                onClick={() => handleOrder(medicine)}
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
