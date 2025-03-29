import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Doctor, insertDoctorSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Extend the doctor schema for form validation
const doctorFormSchema = insertDoctorSchema.extend({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  specialization: z.string().min(2, { message: "Specialization is required" }),
  licenseNumber: z.string().min(3, { message: "License number is required" }),
  contactNumber: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  address: z.string().optional(),
  qualifications: z.string().optional(),
  bio: z.string().optional(),
});

type DoctorFormValues = z.infer<typeof doctorFormSchema>;

interface DoctorFormProps {
  doctor?: Doctor | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function DoctorForm({ doctor, onClose, onSaved }: DoctorFormProps) {
  const [open, setOpen] = useState(true);
  const { toast } = useToast();
  
  // Set up form with default values
  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: doctor ? {
      name: doctor.name || "",
      specialization: doctor.specialization || "",
      licenseNumber: doctor.licenseNumber || "",
      contactNumber: doctor.contactNumber || "",
      email: doctor.email || "",
      address: doctor.address || "",
      qualifications: doctor.qualifications || "",
      bio: doctor.bio || "",
    } : {
      name: "",
      specialization: "",
      licenseNumber: "",
      contactNumber: "",
      email: "",
      address: "",
      qualifications: "",
      bio: "",
    },
  });
  
  // Create doctor mutation
  const createDoctorMutation = useMutation({
    mutationFn: async (data: DoctorFormValues) => {
      const response = await apiRequest("POST", "/api/doctors", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Doctor created",
        description: "The doctor has been created successfully",
      });
      onSaved();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create doctor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update doctor mutation
  const updateDoctorMutation = useMutation({
    mutationFn: async (data: { id: number; values: DoctorFormValues }) => {
      const response = await apiRequest("PATCH", `/api/doctors/${data.id}`, data.values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Doctor updated",
        description: "The doctor has been updated successfully",
      });
      onSaved();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update doctor: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: DoctorFormValues) => {
    if (doctor && doctor.id) {
      updateDoctorMutation.mutate({ id: doctor.id, values });
    } else {
      createDoctorMutation.mutate(values);
    }
  };
  
  const handleClose = () => {
    setOpen(false);
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{doctor ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
          <DialogDescription>
            {doctor 
              ? "Update the doctor's information and click save when you're done."
              : "Fill out the doctor's information and click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialization</FormLabel>
                    <FormControl>
                      <Input placeholder="Cardiology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="MED123456" {...field} />
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
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="doctor@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="qualifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualifications</FormLabel>
                    <FormControl>
                      <Input placeholder="MD, PhD" {...field} />
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
                    <Input placeholder="123 Medical Center Drive, City, State 12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio / Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Doctor's biography or additional notes"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createDoctorMutation.isPending || updateDoctorMutation.isPending}
              >
                {(createDoctorMutation.isPending || updateDoctorMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {doctor ? "Update Doctor" : "Add Doctor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}