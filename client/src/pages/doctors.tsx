import { useState } from "react";
import { useLocation } from "wouter";
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
import { Doctor } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, UserRound, Mail, Phone, Stethoscope, Pencil, Trash, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import DoctorForm from "../components/doctors/doctor-form";

export default function Doctors() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showNewDoctorForm, setShowNewDoctorForm] = useState(false);
  const [deletingDoctorId, setDeletingDoctorId] = useState<number | null>(null);

  // Fetch doctors
  const { data: doctors, isLoading, error } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });

  // Delete doctor mutation
  const deleteDoctorMutation = useMutation({
    mutationFn: async (doctorId: number) => {
      await apiRequest("DELETE", `/api/doctors/${doctorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: "Doctor deleted",
        description: "The doctor has been deleted successfully",
      });
      setDeletingDoctorId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete doctor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter doctors based on search term
  const filteredDoctors = doctors
    ? doctors.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (doctor.specialization &&
            doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (doctor.licenseNumber &&
            doctor.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const handleDeleteDoctor = (doctorId: number) => {
    setDeletingDoctorId(doctorId);
  };

  const confirmDeleteDoctor = () => {
    if (deletingDoctorId) {
      deleteDoctorMutation.mutate(deletingDoctorId);
    }
  };
  
  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setShowNewDoctorForm(true);
  };
  
  const handleAddNewDoctor = () => {
    setEditingDoctor(null);
    setShowNewDoctorForm(true);
  };
  
  const handleDoctorFormClose = () => {
    setShowNewDoctorForm(false);
    setEditingDoctor(null);
  };
  
  const handleDoctorSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
    setShowNewDoctorForm(false);
    setEditingDoctor(null);
  };
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-400 mb-1">Doctors</h1>
          <p className="text-neutral-300">Manage doctor records</p>
        </div>
        
        <Button 
          className="mt-4 md:mt-0 flex items-center"
          onClick={handleAddNewDoctor}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            placeholder="Search doctors..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
        </div>
      </div>
      
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-bold text-neutral-400">Doctor Directory</CardTitle>
          <CardDescription>
            View and manage all doctor information
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-medium text-neutral-300">Name</TableHead>
                  <TableHead className="font-medium text-neutral-300">Specialization</TableHead>
                  <TableHead className="font-medium text-neutral-300">License #</TableHead>
                  <TableHead className="font-medium text-neutral-300">Contact</TableHead>
                  <TableHead className="font-medium text-neutral-300">Email</TableHead>
                  <TableHead className="text-right font-medium text-neutral-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {isLoading ? (
                  // Skeleton loading state
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center">
                          <Skeleton className="w-8 h-8 rounded-full mr-2" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-neutral-400">
                      Failed to load doctors
                    </TableCell>
                  </TableRow>
                ) : filteredDoctors.length > 0 ? (
                  filteredDoctors.map(doctor => (
                    <TableRow key={doctor.id} className="hover:bg-neutral-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0 mr-2 flex items-center justify-center">
                            <UserRound className="h-4 w-4 text-neutral-500" />
                          </div>
                          <span className="font-medium text-neutral-400">Dr. {doctor.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Stethoscope className="h-3 w-3 mr-1 text-neutral-300" />
                          <span className="text-neutral-400">{doctor.specialization}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-300">
                        {doctor.licenseNumber}
                      </TableCell>
                      <TableCell>
                        {doctor.contactNumber ? (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-neutral-300" />
                            <span className="text-neutral-400">{doctor.contactNumber}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-300">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doctor.email ? (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-neutral-300" />
                            <span className="text-neutral-400">{doctor.email}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-300">Not provided</span>
                        )}
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
                            <DropdownMenuItem onClick={() => handleEditDoctor(doctor)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteDoctor(doctor.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-neutral-300">
                      {searchTerm ? "No doctors found matching your search" : "No doctors found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Doctor Form Dialog */}
      {showNewDoctorForm && (
        <DoctorForm 
          doctor={editingDoctor} 
          onClose={handleDoctorFormClose} 
          onSaved={handleDoctorSaved} 
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingDoctorId} onOpenChange={(open) => !open && setDeletingDoctorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              doctor record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteDoctor}
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
