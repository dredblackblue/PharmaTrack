import { useState } from "react";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Order, Supplier } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Package, 
  MoreHorizontal, 
  Calendar, 
  Clock,
  Pencil,
  Trash,
  FileText,
  CheckCircle,
  XCircle,
  TruckIcon,
  ShoppingCart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import OrderForm from "@/components/orders/order-form";
import OrderDetails from "@/components/orders/order-details";

export default function Orders() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);

  // Fetch orders
  const { data: orders, isLoading, error } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Fetch suppliers for dropdown in form
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      await apiRequest("DELETE", `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order deleted",
        description: "The order has been deleted successfully",
      });
      setDeletingOrderId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete order: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status updated",
        description: "The order status has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update order status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter orders based on search term and status
  const filteredOrders = orders
    ? orders.filter((order) => {
        // Check if order matches search term
        const matchesSearch =
          searchTerm === "" ||
          (suppliers?.find(s => s.id === order.supplierId)?.name || "")
            .toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.toString().includes(searchTerm);

        // Check if order matches status filter
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
    : [];

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

  // Handle form actions
  const handleAddNewOrder = () => {
    setEditingOrder(null);
    setShowNewOrderForm(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowNewOrderForm(true);
  };

  const handleOrderFormClose = () => {
    setShowNewOrderForm(false);
    setEditingOrder(null);
  };

  const handleOrderSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    setShowNewOrderForm(false);
    setEditingOrder(null);
  };

  const handleViewOrder = (orderId: number) => {
    setViewOrderId(orderId);
  };

  const handleDeleteOrder = (orderId: number) => {
    setDeletingOrderId(orderId);
  };

  const confirmDeleteOrder = () => {
    if (deletingOrderId) {
      deleteOrderMutation.mutate(deletingOrderId);
    }
  };

  const handleStatusChange = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-400 mb-1">Orders</h1>
          <p className="text-neutral-300">Manage purchase orders from suppliers</p>
        </div>
        
        <Button 
          className="mt-4 md:mt-0 flex items-center"
          onClick={handleAddNewOrder}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search orders..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
        </div>
        
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-bold text-neutral-400">Purchase Orders</CardTitle>
          <CardDescription>
            View and manage all purchase orders from suppliers
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-medium text-neutral-300">Order ID</TableHead>
                  <TableHead className="font-medium text-neutral-300">Supplier</TableHead>
                  <TableHead className="font-medium text-neutral-300">Order Date</TableHead>
                  <TableHead className="font-medium text-neutral-300">Expected Delivery</TableHead>
                  <TableHead className="font-medium text-neutral-300">Status</TableHead>
                  <TableHead className="text-right font-medium text-neutral-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {isLoading ? (
                  // Skeleton loading state
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-neutral-400">
                      Failed to load orders
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map(order => {
                    const supplierName = suppliers?.find(s => s.id === order.supplierId)?.name || "Unknown Supplier";
                    
                    return (
                      <TableRow key={order.id} className="hover:bg-neutral-50">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="bg-primary/10 p-1 rounded mr-2">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-neutral-500">#{order.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-neutral-400">
                          {supplierName}
                        </TableCell>
                        <TableCell className="text-neutral-400">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-neutral-300" />
                            <span>{formatDate(order.orderDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-neutral-400">
                          {order.expectedDeliveryDate ? (
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-neutral-300" />
                              <span>{formatDate(order.expectedDeliveryDate)}</span>
                            </div>
                          ) : (
                            <span className="text-neutral-300">Not specified</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Order
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={order.status === "processing"}
                                onClick={() => handleStatusChange(order.id, "processing")}
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Mark as Processing
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={order.status === "shipped"}
                                onClick={() => handleStatusChange(order.id, "shipped")}
                              >
                                <TruckIcon className="h-4 w-4 mr-2" />
                                Mark as Shipped
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={order.status === "delivered"}
                                onClick={() => handleStatusChange(order.id, "delivered")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Delivered
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={order.status === "cancelled"}
                                onClick={() => handleStatusChange(order.id, "cancelled")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Mark as Cancelled
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-neutral-300">
                      {searchTerm || statusFilter !== "all" 
                        ? "No orders found matching your criteria" 
                        : "No orders found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Order Form Dialog */}
      {showNewOrderForm && (
        <OrderForm 
          order={editingOrder} 
          suppliers={suppliers || []}
          onClose={handleOrderFormClose} 
          onSaved={handleOrderSaved} 
        />
      )}
      
      {/* Order Details Modal */}
      {viewOrderId !== null && (
        <OrderDetails 
          orderId={viewOrderId}
          suppliers={suppliers || []} 
          onClose={() => setViewOrderId(null)} 
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingOrderId} onOpenChange={(open) => !open && setDeletingOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              order and all associated items from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteOrder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}