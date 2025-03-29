import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Order, Supplier, Medicine, insertOrderSchema, OrderItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Extend the order schema for form validation
const orderFormSchema = insertOrderSchema.extend({
  supplierId: z.coerce.number().positive({ message: "Please select a supplier" }),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
});

// Define the schema for order items
const orderItemSchema = z.object({
  medicineId: z.coerce.number().positive({ message: "Please select a medicine" }),
  quantity: z.coerce.number().positive({ message: "Quantity must be greater than 0" }),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;
export type OrderItemFormValues = z.infer<typeof orderItemSchema>;

interface OrderFormProps {
  order?: Order | null;
  suppliers: Supplier[];
  onClose: () => void;
  onSaved: () => void;
}

export default function OrderForm({ order, suppliers, onClose, onSaved }: OrderFormProps) {
  const [open, setOpen] = useState(true);
  const [orderItems, setOrderItems] = useState<OrderItemFormValues[]>([]);
  const { toast } = useToast();

  // Fetch medicines for the select dropdown
  const { data: medicines } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  // Set up form with default values
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: order
      ? {
          supplierId: order.supplierId,
          expectedDeliveryDate: order.expectedDeliveryDate
            ? format(new Date(order.expectedDeliveryDate), "yyyy-MM-dd")
            : undefined,
          notes: order.notes || "",
        }
      : {
          supplierId: 0,
          expectedDeliveryDate: "",
          notes: "",
        },
  });

  // Set up order item form
  const itemForm = useForm<OrderItemFormValues>({
    resolver: zodResolver(orderItemSchema),
    defaultValues: {
      medicineId: 0,
      quantity: 1,
    },
  });

  // Load existing order items if editing
  useEffect(() => {
    if (order) {
      const fetchOrderItems = async () => {
        try {
          const response = await apiRequest("GET", `/api/orders/${order.id}`);
          const data = await response.json();
          if (data.items && Array.isArray(data.items)) {
            const items = data.items.map((item: OrderItem) => ({
              medicineId: item.medicineId,
              quantity: item.quantity,
            }));
            setOrderItems(items);
          }
        } catch (error) {
          console.error("Failed to fetch order items:", error);
        }
      };
      fetchOrderItems();
    }
  }, [order]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: { order: OrderFormValues; items: OrderItemFormValues[] }) => {
      const orderResponse = await apiRequest("POST", "/api/orders", data.order);
      const orderData = await orderResponse.json();

      // Add items to the order
      for (const item of data.items) {
        await apiRequest("POST", `/api/orders/${orderData.id}/items`, item);
      }

      return orderData;
    },
    onSuccess: () => {
      toast({
        title: "Order created",
        description: "The order has been created successfully",
      });
      onSaved();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create order: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (data: { id: number; order: OrderFormValues; items: OrderItemFormValues[] }) => {
      // Update order details
      const orderResponse = await apiRequest("PATCH", `/api/orders/${data.id}`, data.order);
      
      // First, delete all existing items (simplified approach)
      // In a real application, you might want to update existing items instead
      const existingItems = await apiRequest("GET", `/api/orders/${data.id}`);
      const existingItemsData = await existingItems.json();
      
      if (existingItemsData.items && Array.isArray(existingItemsData.items)) {
        for (const item of existingItemsData.items) {
          await apiRequest("DELETE", `/api/order-items/${item.id}`);
        }
      }
      
      // Add new items
      for (const item of data.items) {
        await apiRequest("POST", `/api/orders/${data.id}/items`, item);
      }
      
      return await orderResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Order updated",
        description: "The order has been updated successfully",
      });
      onSaved();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update order: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle adding an item to the order
  const handleAddItem = (values: OrderItemFormValues) => {
    setOrderItems([...orderItems, values]);
    itemForm.reset({ medicineId: 0, quantity: 1 });
  };

  // Handle removing an item from the order
  const handleRemoveItem = (index: number) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  // Handle form submission
  const onSubmit = (values: OrderFormValues) => {
    if (orderItems.length === 0) {
      toast({
        title: "No items added",
        description: "Please add at least one item to the order",
        variant: "destructive",
      });
      return;
    }

    if (order && order.id) {
      updateOrderMutation.mutate({ id: order.id, order: values, items: orderItems });
    } else {
      createOrderMutation.mutate({ order: values, items: orderItems });
    }
  };

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{order ? "Edit Order" : "Create New Order"}</DialogTitle>
          <DialogDescription>
            {order
              ? "Update the order details and click save when you're done."
              : "Fill out the order details, add items, and click save when you're done."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedDeliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions or notes about this order"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-neutral-50 p-4 rounded-md">
              <h3 className="text-sm font-medium mb-3">Order Items</h3>

              {/* Item Form */}
              <Form {...itemForm}>
                <div className="grid grid-cols-1 md:grid-cols-8 gap-3 mb-4 items-end">
                  <div className="md:col-span-4">
                    <FormField
                      control={itemForm.control}
                      name="medicineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medicine</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a medicine" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {medicines?.map((medicine) => (
                                <SelectItem key={medicine.id} value={medicine.id.toString()}>
                                  {medicine.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <FormField
                      control={itemForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="md:col-span-1">
                    <Button
                      type="button"
                      onClick={itemForm.handleSubmit(handleAddItem)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Form>

              {/* Items List */}
              <div className="border rounded-md mb-4">
                {orderItems.length === 0 ? (
                  <div className="p-4 text-center text-neutral-400 text-sm">
                    No items added yet
                  </div>
                ) : (
                  <ScrollArea className="max-h-[200px]">
                    <div className="p-2">
                      {orderItems.map((item, index) => {
                        const medicine = medicines?.find((m) => m.id === item.medicineId);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 border-b last:border-0"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{medicine?.name || "Unknown Medicine"}</div>
                              <div className="text-xs text-neutral-400">
                                Quantity: {item.quantity}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash className="h-4 w-4 text-neutral-400" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
              >
                {(createOrderMutation.isPending || updateOrderMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {order ? "Update Order" : "Create Order"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}