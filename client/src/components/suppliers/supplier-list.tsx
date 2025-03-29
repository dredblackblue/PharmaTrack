import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Supplier } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building, Mail, Phone, User, MoreVertical, Edit, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EditSupplierForm from "../suppliers/edit-supplier-form";

export default function SupplierList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  
  // Fetch suppliers
  const { data: suppliers, isLoading, error } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });
  
  // Filter suppliers based on search query
  const filteredSuppliers = suppliers?.filter(supplier => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(searchLower) ||
      supplier.contactPerson?.toLowerCase().includes(searchLower) ||
      supplier.email?.toLowerCase().includes(searchLower) ||
      supplier.contactNumber?.toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <>
      <Card>
        <CardHeader className="p-4 border-b flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <CardTitle className="text-lg font-bold text-neutral-400">Supplier Directory</CardTitle>
            <CardDescription className="text-neutral-300 mt-1">
              {!isLoading && !error && `Showing ${filteredSuppliers?.length || 0} suppliers`}
            </CardDescription>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-0 w-full md:w-auto">
            {/* Search input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search suppliers..."
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
                  <TableHead className="font-medium text-neutral-300">Supplier Name</TableHead>
                  <TableHead className="font-medium text-neutral-300">Contact Person</TableHead>
                  <TableHead className="font-medium text-neutral-300">Email</TableHead>
                  <TableHead className="font-medium text-neutral-300">Phone</TableHead>
                  <TableHead className="font-medium text-neutral-300">Address</TableHead>
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
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-neutral-400">
                      Failed to load suppliers
                    </TableCell>
                  </TableRow>
                ) : filteredSuppliers && filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map(supplier => (
                    <TableRow key={supplier.id} className="hover:bg-neutral-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0 mr-2 flex items-center justify-center">
                            <Building className="h-4 w-4 text-neutral-500" />
                          </div>
                          <span className="font-medium text-neutral-400">{supplier.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.contactPerson ? (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1 text-neutral-300" />
                            <span className="text-neutral-400">{supplier.contactPerson}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-300">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.email ? (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-neutral-300" />
                            <span className="text-neutral-400">{supplier.email}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-300">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {supplier.contactNumber ? (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-neutral-300" />
                            <span className="text-neutral-400">{supplier.contactNumber}</span>
                          </div>
                        ) : (
                          <span className="text-neutral-300">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-neutral-300">
                        {supplier.address || 'Not provided'}
                      </TableCell>
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
                              onClick={() => setEditSupplier(supplier)}
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
                      No suppliers found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Supplier Modal */}
      {editSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-3xl overflow-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <EditSupplierForm 
              supplier={editSupplier} 
              onCancel={() => setEditSupplier(null)} 
            />
          </div>
        </div>
      )}
    </>
  );
}