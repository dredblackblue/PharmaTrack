import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Medicine, Supplier, insertOrderSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Extend the order schema to include order items
const orderFormSchema = z.object({
  supplierId: z.string().min(1, "Please select a supplier"),
  quantity: z.string().min(1, "Quantity is required")
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, "Quantity must be greater than 0"),
  expectedDeliveryDate: z.string().min(1, "Expected delivery date is required"),
  notes: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: Medicine;
}

export function OrderModal({ isOpen, onClose, medicine }: OrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch suppliers
  const { data: suppliers, isLoading: isSuppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      supplierId: "",
      quantity: "100",
      expectedDeliveryDate: "",
      notes: "",
    },
  });
  
  // Set the default delivery date to 7 days from now
  useEffect(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    form.setValue('expectedDeliveryDate', nextWeek.toISOString().split('T')[0]);
  }, [form, isOpen]);
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormValues) => {
      const orderRes = await apiRequest("POST", "/api/orders", {
        supplierId: parseInt(data.supplierId),
        expectedDeliveryDate: new Date(data.expectedDeliveryDate),
        notes: data.notes,
      });
      
      const order = await orderRes.json();
      
      // Add order item
      const orderItemRes = await apiRequest("POST", `/api/orders/${order.id}/items`, {
        medicineId: medicine.id,
        quantity: data.quantity,
      });
      
      return orderItemRes.json();
    },
    onSuccess: () => {
      toast({
        title: "Order placed successfully",
        description: `Order for ${medicine.name} has been placed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  const onSubmit = (data: OrderFormValues) => {
    setIsSubmitting(true);
    createOrderMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-neutral-400">Order Medicine</DialogTitle>
          <DialogDescription>
            Place an order for the selected medicine with your preferred supplier.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <div className="p-3 bg-neutral-50 rounded-lg mb-2">
            <div className="flex justify-between">
              <div>
                <p className="font-medium text-neutral-400">{medicine.name}</p>
                <p className="text-sm text-neutral-300">{medicine.category}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-300">
                  Current Stock: <span className="font-medium text-neutral-400">{medicine.stockQuantity} units</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSuppliersLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers?.map(supplier => (
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" placeholder="Enter quantity" {...field} />
                  </FormControl>
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
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add notes if any" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
