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
import { Doctor } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, UserRound, Mail, Phone, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Doctors() {
  // Fetch doctors
  const { data: doctors, isLoading, error } = useQuery<Doctor[]>({
    queryKey: ["/api/doctors"],
  });
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-400 mb-1">Doctors</h1>
          <p className="text-neutral-300">Manage doctor records</p>
        </div>
        
        <Button 
          className="mt-4 md:mt-0 flex items-center"
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
                ) : doctors && doctors.length > 0 ? (
                  doctors.map(doctor => (
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
                        <Button variant="outline" size="sm">View Profile</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-neutral-300">
                      No doctors found
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
