import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreVertical, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import EditPatientForm from "./edit-patient-form";

export default function PatientList() {
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Fetch patients
  const { data: patients, isLoading, error } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });
  
  // Filter patients based on search query
  const filteredPatients = patients?.filter(patient => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.contactNumber?.toLowerCase().includes(searchLower)
    );
  });
  
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };
  
  return (
    <>
      <Card>
        <CardHeader className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="text-lg font-bold text-neutral-400">Patients Directory</CardTitle>
            <CardDescription className="text-neutral-300 mt-1">
              {!isLoading && !error && `Showing ${filteredPatients?.length || 0} patients`}
            </CardDescription>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-0 w-full md:w-auto">
            {/* Search input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search patients..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Button variant="outline" className="flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-medium text-neutral-300">Name</TableHead>
                  <TableHead className="font-medium text-neutral-300">Contact Number</TableHead>
                  <TableHead className="font-medium text-neutral-300">Email</TableHead>
                  <TableHead className="font-medium text-neutral-300">Date of Birth</TableHead>
                  <TableHead className="font-medium text-neutral-300">Gender</TableHead>
                  <TableHead className="text-right font-medium text-neutral-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {isLoading ? (
                  // Skeleton loading state
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-neutral-400">
                      Failed to load patients
                    </TableCell>
                  </TableRow>
                ) : filteredPatients && filteredPatients.length > 0 ? (
                  filteredPatients.map(patient => (
                    <TableRow key={patient.id} className="hover:bg-neutral-50">
                      <TableCell className="font-medium text-neutral-400">
                        {patient.name}
                      </TableCell>
                      <TableCell className="text-neutral-300">{patient.contactNumber || 'N/A'}</TableCell>
                      <TableCell className="text-neutral-300">{patient.email || 'N/A'}</TableCell>
                      <TableCell className="text-neutral-300">{formatDate(patient.dateOfBirth)}</TableCell>
                      <TableCell className="text-neutral-300">{patient.gender || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="flex items-center cursor-pointer"
                              onClick={() => setEditPatient(patient)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-neutral-300">
                      No patients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Patient Modal */}
      {editPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-3xl overflow-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <EditPatientForm 
              patient={editPatient} 
              onCancel={() => setEditPatient(null)} 
            />
          </div>
        </div>
      )}
    </>
  );
}