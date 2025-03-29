import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Medicine } from "@shared/schema";
import { OrderModal } from "@/components/inventory/order-modal";
import { Skeleton } from "@/components/ui/skeleton";

export default function LowStockAlert() {
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fetch low stock medicines
  const { data: medicines, isLoading, error } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines/low-stock"],
  });
  
  const handleOrderClick = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setIsModalOpen(true);
  };
  
  return (
    <>
      <Card className="border border-neutral-100 mb-6">
        <CardHeader className="p-4 border-b flex justify-between items-center">
          <CardTitle className="text-lg font-bold text-neutral-400">Low Stock Alerts</CardTitle>
          <Button variant="link" className="text-sm text-primary hover:underline p-0">View All</Button>
        </CardHeader>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-300">Medicine Name</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-300">Category</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-300">Current Stock</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="border-t border-neutral-100">
                    <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-12" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr className="border-t border-neutral-100">
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                    Failed to load low stock medicines
                  </td>
                </tr>
              ) : medicines && medicines.length > 0 ? (
                medicines.map(medicine => (
                  <tr key={medicine.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-400">{medicine.name}</td>
                    <td className="px-4 py-3 text-neutral-300">{medicine.category}</td>
                    <td className="px-4 py-3 text-neutral-400">{medicine.stockQuantity} units</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        medicine.stockStatus === 'critical' 
                          ? 'bg-error bg-opacity-10 text-error' 
                          : 'bg-warning bg-opacity-10 text-warning'
                      }`}>
                        {medicine.stockStatus === 'critical' ? 'Critical' : 'Low Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button 
                        variant="link" 
                        className="text-primary hover:underline p-0 h-auto font-normal"
                        onClick={() => handleOrderClick(medicine)}
                      >
                        Order
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-neutral-100">
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-300">
                    No low stock medicines found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <CardContent className="p-4 text-center">
          <Button variant="link" className="text-primary hover:underline text-sm font-medium">
            Load More
          </Button>
        </CardContent>
      </Card>
      
      {selectedMedicine && (
        <OrderModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          medicine={selectedMedicine} 
        />
      )}
    </>
  );
}
