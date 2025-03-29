import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Medicine } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExpiryAlerts() {
  // Fetch expiring medicines (within 30 days)
  const { data: medicines, isLoading, error } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines/expiring?days=30"],
  });
  
  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: Date | string | null | undefined) => {
    if (!expiryDate) return "Unknown";
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };
  
  return (
    <Card className="border border-neutral-100 mb-6">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg font-bold text-neutral-400">Expiring Medicines</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          // Skeleton loading state
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="mb-4 pb-4 border-b border-neutral-100 last:border-0 last:mb-0 last:pb-0">
              <div className="flex justify-between mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="py-6 text-center text-neutral-400">
            Failed to load expiring medicines
          </div>
        ) : medicines && medicines.length > 0 ? (
          medicines.slice(0, 3).map(medicine => (
            <div key={medicine.id} className="mb-4 pb-4 border-b border-neutral-100 last:border-0 last:mb-0 last:pb-0">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-neutral-400">{medicine.name}</span>
                <span className={`text-xs ${
                  !medicine.expiryDate ? 'text-neutral-300' :
                  new Date(medicine.expiryDate) <= new Date() ? 'text-error' :
                  new Date(medicine.expiryDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 ? 'text-error' : 'text-warning'
                }`}>
                  {getDaysUntilExpiry(medicine.expiryDate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-300">Batch: {medicine.batchNumber || 'N/A'}</span>
                <span className="text-neutral-300">Stock: {medicine.stockQuantity} units</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-neutral-300">
            No expiring medicines found
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary hover:underline text-sm font-medium">
            View All Expiring
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
