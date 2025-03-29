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
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, UserRound, Calendar, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Patients() {
  // Fetch patients
  const { data: patients, isLoading, error } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-400 mb-1">Patients</h1>
          <p className="text-neutral-300">Manage patient records</p>
        </div>
        
        <Button 
          className="mt-4 md:mt-0 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            placeholder="Search patients..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
        </div>
      </div>
      
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-bold text-neutral-400">Patient Directory</CardTitle>
          <CardDescription>
            View and manage all patient information
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-medium text-neutral-300">Name</TableHead>
                  <TableHead className="font-medium text-neutral-300">Gender</TableHead>
                  <TableHead className="font-medium text-neutral-300">Date of Birth</TableHead>
                  <TableHead className="font-medium text-neutral-300">Contact</TableHead>
                  <TableHead className="font-medium text-neutral-300">Email</TableHead>
                  <TableHead className="font-medium text-neutral-300">Allergies</TableHead>
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
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-neutral-400">
                      Failed to load patients
                    </TableCell>
                  </TableRow>
                ) : patients && patients.length > 0 ? (
                  patients.map(patient => (
                    <TableRow key={patient.id} className="hover:bg-neutral-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0 mr-2 flex items-center justify-center">
                            <UserRound className="h-4 w-4 text-neutral-500" />
                          </div>
                          <span className="font-medium text-neutral-400">{patient.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-300">
                        {patient.gender || 'Not specified'}
                      </TableCell>
                      <TableCell className="text-neutral-300">
                        {patient.dateOfBirth ? (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-neutral-300" />
                            {new Date(patient.dateOfBirth).toLocaleDateString()}
                          </div>
                        ) : (
                          'Not specified'
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.contactNumber ? (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-neutral-300" />
                            <span className="text-neutral-400">{patient.contactNumber}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-300">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.email ? (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-neutral-300" />
                            <span className="text-neutral-400">{patient.email}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-300">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell className="text-neutral-300">
                        {patient.allergies || 'None'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">View Profile</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-neutral-300">
                      No patients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
