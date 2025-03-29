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
import { Prescription } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Prescriptions() {
  // Fetch prescriptions
  const { data: prescriptions, isLoading, error } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions"],
  });
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-400 mb-1">Prescriptions</h1>
          <p className="text-neutral-300">Manage patient prescriptions</p>
        </div>
        
        <Button 
          className="mt-4 md:mt-0 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            placeholder="Search prescriptions..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
        </div>
      </div>
      
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-bold text-neutral-400">Recent Prescriptions</CardTitle>
          <CardDescription>
            View and manage all prescriptions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-medium text-neutral-300">Prescription #</TableHead>
                  <TableHead className="font-medium text-neutral-300">Patient</TableHead>
                  <TableHead className="font-medium text-neutral-300">Doctor</TableHead>
                  <TableHead className="font-medium text-neutral-300">Issue Date</TableHead>
                  <TableHead className="font-medium text-neutral-300">Status</TableHead>
                  <TableHead className="text-right font-medium text-neutral-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {isLoading ? (
                  // Skeleton loading state
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-neutral-400">
                      Failed to load prescriptions
                    </TableCell>
                  </TableRow>
                ) : prescriptions && prescriptions.length > 0 ? (
                  prescriptions.map(prescription => (
                    <TableRow key={prescription.id} className="hover:bg-neutral-50">
                      <TableCell className="font-medium text-neutral-400">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          {prescription.prescriptionNumber}
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-400">Patient #{prescription.patientId}</TableCell>
                      <TableCell className="text-neutral-400">Dr. #{prescription.doctorId}</TableCell>
                      <TableCell className="text-neutral-300">
                        {new Date(prescription.issueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs font-medium bg-success bg-opacity-10 text-success rounded-full">
                          Active
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-neutral-300">
                      No prescriptions found
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
