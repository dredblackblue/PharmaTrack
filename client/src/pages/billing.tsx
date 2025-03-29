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
import { Transaction } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FileText, Receipt, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function Billing() {
  // For navigation
  const [_, navigate] = useLocation();
  
  // Fetch transactions
  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-success bg-opacity-10 text-success border-success">
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-error bg-opacity-10 text-error border-error">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-neutral-300 bg-opacity-10 text-neutral-300 border-neutral-300">
            Pending
          </Badge>
        );
    }
  };
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-400 mb-1">Billing & Transactions</h1>
          <p className="text-neutral-300">Manage billing and transaction history</p>
        </div>
        
        <Button 
          className="mt-4 md:mt-0 flex items-center"
          onClick={() => navigate("/transactions/new")}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            placeholder="Search transactions..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-300" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-300">Total Revenue</p>
                <h3 className="text-2xl font-bold text-neutral-400">
                  {formatCurrency(transactions?.reduce((sum, t) => 
                    t.status === 'completed' ? sum + t.totalAmount : sum, 0
                  ) || 0)}
                </h3>
              </div>
              <div className="bg-success bg-opacity-10 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-300">Pending Payments</p>
                <h3 className="text-2xl font-bold text-warning">
                  {formatCurrency(transactions?.reduce((sum, t) => 
                    t.status === 'pending' ? sum + t.totalAmount : sum, 0
                  ) || 0)}
                </h3>
              </div>
              <div className="bg-warning bg-opacity-10 p-3 rounded-full">
                <Receipt className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-300">Transactions (Today)</p>
                <h3 className="text-2xl font-bold text-neutral-400">
                  {transactions?.filter(t => {
                    const today = new Date();
                    const txDate = new Date(t.transactionDate);
                    return today.toDateString() === txDate.toDateString();
                  }).length || 0}
                </h3>
              </div>
              <div className="bg-primary-light bg-opacity-10 p-3 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="p-4 border-b">
          <CardTitle className="text-lg font-bold text-neutral-400">Transaction History</CardTitle>
          <CardDescription>
            View and manage all transactions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="font-medium text-neutral-300">Transaction ID</TableHead>
                  <TableHead className="font-medium text-neutral-300">Patient</TableHead>
                  <TableHead className="font-medium text-neutral-300">Prescription</TableHead>
                  <TableHead className="font-medium text-neutral-300">Date</TableHead>
                  <TableHead className="font-medium text-neutral-300">Amount</TableHead>
                  <TableHead className="font-medium text-neutral-300">Status</TableHead>
                  <TableHead className="text-right font-medium text-neutral-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {isLoading ? (
                  // Skeleton loading state
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-neutral-400">
                      Failed to load transactions
                    </TableCell>
                  </TableRow>
                ) : transactions && transactions.length > 0 ? (
                  transactions.map(transaction => (
                    <TableRow key={transaction.id} className="hover:bg-neutral-50">
                      <TableCell className="font-medium text-neutral-400">
                        #{transaction.id}
                      </TableCell>
                      <TableCell className="text-neutral-400">
                        Patient #{transaction.patientId}
                      </TableCell>
                      <TableCell className="text-neutral-300">
                        {transaction.prescriptionId ? (
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1 text-primary" />
                            <span>#{transaction.prescriptionId}</span>
                          </div>
                        ) : (
                          'Direct Sale'
                        )}
                      </TableCell>
                      <TableCell className="text-neutral-300">
                        {formatDate(transaction.transactionDate)}
                      </TableCell>
                      <TableCell className="font-medium text-neutral-400">
                        {formatCurrency(transaction.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-neutral-300">
                      No transactions found
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
