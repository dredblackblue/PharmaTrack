import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Transaction } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

export default function RecentTransactions() {
  // Fetch recent transactions
  const { data: transactions, isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Convert cents to dollars
  };
  
  return (
    <Card className="border border-neutral-100">
      <CardHeader className="p-4 border-b flex justify-between items-center">
        <CardTitle className="text-lg font-bold text-neutral-400">Recent Transactions</CardTitle>
        <Button variant="link" className="text-sm text-primary hover:underline p-0">View All</Button>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-300">Patient</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-300">Date</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-300">Prescription</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-300">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton loading state
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0 mr-2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
                </tr>
              ))
            ) : error ? (
              <tr className="border-t border-neutral-100">
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                  Failed to load recent transactions
                </td>
              </tr>
            ) : transactions && transactions.length > 0 ? (
              transactions.slice(0, 4).map(transaction => (
                <tr key={transaction.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0 mr-2 flex items-center justify-center">
                        <span className="text-xs text-neutral-600">P</span>
                      </div>
                      <span className="text-neutral-400">Patient #{transaction.patientId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {transaction.prescriptionId ? `PRE-${transaction.prescriptionId}` : 'Direct Sale'}
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-400">
                    {formatCurrency(transaction.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      transaction.status === 'completed'
                        ? 'bg-success bg-opacity-10 text-success'
                        : transaction.status === 'cancelled'
                        ? 'bg-error bg-opacity-10 text-error'
                        : 'bg-neutral-300 bg-opacity-10 text-neutral-300'
                    }`}>
                      {transaction.status === 'completed' ? 'Completed' : 
                       transaction.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-neutral-100">
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-300">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <CardContent className="p-4 text-center">
        <Button variant="link" className="text-primary hover:underline text-sm font-medium">
          Load More
        </Button>
      </CardContent>
    </Card>
  );
}
