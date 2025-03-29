import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, X, Plus, CalendarIcon, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { InsertTransaction, Medicine, Patient } from "@shared/schema";

// Create a custom schema for the transaction form
const transactionFormSchema = z.object({
  patientId: z.number({
    required_error: "Please select a patient",
  }),
  prescriptionId: z.number().nullable(),
  transactionNumber: z.string().min(1, { message: "Transaction number is required" }),
  transactionDate: z.date({
    required_error: "Please select a date",
  }),
  patientName: z.string().optional(),
  notes: z.string().optional(),
  totalAmount: z.number().min(0),
  items: z.array(
    z.object({
      medicineId: z.number({
        required_error: "Please select a medicine",
      }),
      medicineName: z.string().min(1, { message: "Medicine name is required" }),
      quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
      unitPrice: z.number().min(0),
      price: z.number().min(0),
    })
  ).min(1, { message: "At least one item is required" }),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export default function AddTransactionForm() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch patients for dropdown
  const { data: patients, isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Fetch medicines for dropdown
  const { data: medicines, isLoading: isLoadingMedicines } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  // Generate a unique transaction number
  const generateTransactionNumber = () => {
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `TRX-${timestamp}-${randomPart}`;
  };

  // Initialize form with default values
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      patientId: 0,
      prescriptionId: null,
      transactionNumber: generateTransactionNumber(),
      transactionDate: new Date(),
      patientName: "",
      notes: "",
      totalAmount: 0,
      items: [],
    },
  });

  // Set up field array for transaction items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      // Format the transaction data before sending
      const transactionData: InsertTransaction = {
        patientId: data.patientId,
        prescriptionId: data.prescriptionId,
        transactionNumber: data.transactionNumber,
        totalAmount: data.totalAmount,
        patientName: data.patientName,
        notes: data.notes,
      };

      // Create the transaction
      const response = await apiRequest("POST", "/api/transactions", transactionData);
      const transaction = await response.json();

      // Create each transaction item
      for (const item of data.items) {
        await apiRequest("POST", "/api/transaction-items", {
          transactionId: transaction.id,
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          price: item.price,
        });
      }

      return transaction;
    },
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // Show success message
      toast({
        title: "Transaction Created",
        description: "The transaction has been successfully created",
        variant: "default",
      });
      
      // Navigate back to transactions list
      navigate("/transactions");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    },
  });

  // Calculate total amount whenever items change
  useEffect(() => {
    const items = form.watch("items");
    const total = items.reduce((sum, item) => sum + item.price, 0);
    form.setValue("totalAmount", total);
  }, [form.watch("items")]);

  // Handle patient selection
  const onPatientChange = (patientId: string) => {
    const id = parseInt(patientId, 10);
    form.setValue("patientId", id);
    
    // Find the patient and set the patient name
    const patient = patients?.find(p => p.id === id);
    if (patient) {
      setSelectedPatient(patient);
      form.setValue("patientName", patient.name);
    }
  };

  // Handle medicine selection
  const onMedicineSelect = (medicineId: string) => {
    const id = parseInt(medicineId, 10);
    const medicine = medicines?.find(m => m.id === id);
    
    if (medicine) {
      // Calculate the price based on the medicine's price and quantity
      const quantity = 1;
      const unitPrice = medicine.price;
      const price = unitPrice * quantity;
      
      append({
        medicineId: id,
        medicineName: medicine.name,
        quantity,
        unitPrice,
        price,
      });
    }
  };

  // Handle quantity change for an item
  const handleQuantityChange = (index: number, quantity: number) => {
    const items = form.getValues("items");
    const item = items[index];
    
    if (item) {
      const newPrice = item.unitPrice * quantity;
      form.setValue(`items.${index}.quantity`, quantity);
      form.setValue(`items.${index}.price`, newPrice);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, "PPP");
  };

  // Handle form submission
  const onSubmit = (data: TransactionFormValues) => {
    addTransactionMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Transaction</CardTitle>
        <CardDescription>Record a new sales transaction</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Transaction Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="transactionNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Auto-generated unique transaction identifier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Transaction Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="justify-start text-left font-normal"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                formatDate(field.value)
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={() => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <Select onValueChange={onPatientChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingPatients ? (
                            <div className="flex items-center justify-center p-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : (
                            patients?.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id.toString()}>
                                {patient.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional notes about this transaction"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Transaction Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Transaction Items</h3>
                
                <Select onValueChange={onMedicineSelect}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Add item" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingMedicines ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      medicines
                        ?.filter(m => m.stockStatus !== "out_of_stock")
                        .map((medicine) => (
                          <SelectItem key={medicine.id} value={medicine.id.toString()}>
                            {medicine.name} (${(medicine.price / 100).toFixed(2)})
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {fields.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>{form.getValues(`items.${index}.medicineName`)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            className="w-20"
                            value={form.getValues(`items.${index}.quantity`)}
                            onChange={(e) => {
                              const quantity = parseInt(e.target.value, 10);
                              if (!isNaN(quantity) && quantity > 0) {
                                handleQuantityChange(index, quantity);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          ${(form.getValues(`items.${index}.unitPrice`) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(form.getValues(`items.${index}.price`) / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${(form.getValues("totalAmount") / 100).toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="rounded-md bg-muted p-8 text-center">
                  <div className="flex justify-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No items added</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add items to this transaction using the dropdown above
                  </p>
                </div>
              )}
              
              {form.formState.errors.items && (
                <div className="text-sm font-medium text-destructive">
                  {form.formState.errors.items.message}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/transactions")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addTransactionMutation.isPending}
            >
              {addTransactionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Transaction
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}