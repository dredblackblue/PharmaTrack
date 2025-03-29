import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertMedicineSchema, Medicine, Supplier } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

// Extend the medicine schema for the form
const medicineFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  price: z.string().min(1, "Price is required")
    .transform(val => Number(val) * 100), // Convert to cents
  stockQuantity: z.string().min(1, "Stock quantity is required")
    .transform(val => Number(val)),
  expiryDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  batchNumber: z.string().optional(),
  supplierId: z.number().optional(),
});

type MedicineFormValues = z.infer<typeof medicineFormSchema>;

interface EditMedicineFormProps {
  medicine: Medicine;
  onCancel: () => void;
}

export default function EditMedicineForm({ medicine, onCancel }: EditMedicineFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  
  // Fetch suppliers for select dropdown
  const { data: suppliers, isLoading: isSuppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  
  // Format date for input field
  const formatDateForInput = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  // Format price for input field (convert cents to dollars)
  const formatPriceForInput = (price: number) => {
    return (price / 100).toString();
  };
  
  const form = useForm<MedicineFormValues>({
    resolver: zodResolver(medicineFormSchema),
    defaultValues: {
      name: medicine.name,
      description: medicine.description || "",
      category: medicine.category,
      price: formatPriceForInput(medicine.price),
      stockQuantity: medicine.stockQuantity.toString(),
      batchNumber: medicine.batchNumber || "",
      supplierId: medicine.supplierId || undefined,
      expiryDate: formatDateForInput(medicine.expiryDate),
    },
  });
  
  // Update medicine mutation
  const updateMedicineMutation = useMutation({
    mutationFn: async (data: MedicineFormValues) => {
      const res = await apiRequest("PATCH", `/api/medicines/${medicine.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Medicine updated successfully",
        description: "The medicine has been updated in the inventory.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      onCancel();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update medicine",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete medicine mutation
  const deleteMedicineMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/medicines/${medicine.id}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Medicine deleted successfully",
        description: "The medicine has been removed from the inventory.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/medicines"] });
      navigate("/inventory");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete medicine",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: MedicineFormValues) => {
    updateMedicineMutation.mutate(data);
  };
  
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this medicine? This action cannot be undone.")) {
      deleteMedicineMutation.mutate();
    }
  };
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-neutral-400">Edit Medicine</CardTitle>
        <CardDescription>
          Update medicine information or delete it from inventory.
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medicine Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter medicine name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Antibiotics, Painkillers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter medicine description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>Enter the price in dollars (e.g., 12.50)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="batchNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., BTC-2023-45" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
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
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <div>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={updateMedicineMutation.isPending || deleteMedicineMutation.isPending}
                className="flex items-center"
              >
                {deleteMedicineMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={updateMedicineMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMedicineMutation.isPending}
              >
                {updateMedicineMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}