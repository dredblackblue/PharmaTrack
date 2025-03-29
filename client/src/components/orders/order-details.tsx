import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Order, Supplier, Medicine, OrderItem } from "@shared/schema";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Calendar, Clock, Truck, FileText, Building } from "lucide-react";

interface OrderDetailsProps {
  orderId: number;
  suppliers: Supplier[];
  onClose: () => void;
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

export default function OrderDetails({ orderId, suppliers, onClose }: OrderDetailsProps) {
  const [open, setOpen] = useState(true);

  // Fetch order details including items
  const { data: order, isLoading, error } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${orderId}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/orders/${orderId}`);
      return await response.json();
    },
  });

  // Fetch medicines for item details
  const { data: medicines } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  // Format date
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMM dd, yyyy");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Processing</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">Shipped</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Find supplier name
  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : "Unknown Supplier";
  };

  // Find medicine name
  const getMedicineName = (medicineId: number) => {
    const medicine = medicines?.find(m => m.id === medicineId);
    return medicine ? medicine.name : "Unknown Medicine";
  };

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2 text-primary" />
            Order Details {order && <span className="ml-2">#{order.id}</span>}
          </DialogTitle>
          <DialogDescription>
            View the complete details of this order and its items
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">
            Failed to load order details
          </div>
        ) : order ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-neutral-500">Status</div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-neutral-500">Supplier</div>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-1 text-neutral-400" />
                  <span className="text-neutral-700">{getSupplierName(order.supplierId)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-neutral-500">Order Date</div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-neutral-400" />
                  <span className="text-neutral-700">{formatDate(order.orderDate)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-neutral-500">Expected Delivery</div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-neutral-400" />
                  <span className="text-neutral-700">
                    {order.expectedDeliveryDate
                      ? formatDate(order.expectedDeliveryDate)
                      : "Not specified"}
                  </span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4">
                <div className="text-sm font-medium text-neutral-500">Notes</div>
                <div className="p-3 bg-neutral-50 rounded-md text-sm text-neutral-700 mt-1">
                  {order.notes}
                </div>
              </div>
            )}

            <Separator className="my-4" />

            <div>
              <h3 className="text-sm font-medium text-neutral-500 mb-3">Order Items</h3>

              {order.items && order.items.length > 0 ? (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-md flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-neutral-700">
                          {getMedicineName(item.medicineId)}
                        </div>
                        <div className="text-sm text-neutral-500">Qty: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-neutral-400 border rounded-md">
                  No items found for this order
                </div>
              )}
            </div>
          </>
        ) : null}

        <DialogFooter>
          <Button onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}