import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Supplier } from "@shared/schema";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

// Create a schema for the form
const supplierFormSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface EditSupplierFormProps {
  supplier: Supplier;
  onCancel: () => void;
}

export default function EditSupplierForm({ supplier, onCancel }: EditSupplierFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      contactNumber: supplier.contactNumber || "",
      address: supplier.address || "",
      notes: supplier.notes || "",
    },
  });
  
  // Update supplier mutation
  const updateSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      const res = await apiRequest("PATCH", `/api/suppliers/${supplier.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Supplier updated successfully",
        description: "The supplier information has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      onCancel();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update supplier",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete supplier mutation
  const deleteSupplierMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/suppliers/${supplier.id}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Supplier deleted successfully",
        description: "The supplier has been removed from the system.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      navigate("/suppliers");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete supplier",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: SupplierFormValues) => {
    updateSupplierMutation.mutate(data);
  };
  
  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this supplier? This action cannot be undone.")) {
      deleteSupplierMutation.mutate();
    }
  };
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-neutral-400">Edit Supplier</CardTitle>
        <CardDescription>
          Update supplier information or delete supplier from the system.
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter supplier name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact person name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter supplier address" {...field} />
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
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter any additional notes or information" {...field} />
                  </FormControl>
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
                disabled={updateSupplierMutation.isPending || deleteSupplierMutation.isPending}
                className="flex items-center"
              >
                {deleteSupplierMutation.isPending ? (
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
                disabled={updateSupplierMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateSupplierMutation.isPending}
              >
                {updateSupplierMutation.isPending ? (
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