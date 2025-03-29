import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import { Transaction, TransactionItem } from "@shared/schema";

interface ViewTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

interface TransactionWithItems extends Transaction {
  items: TransactionItem[];
}

export default function ViewTransactionModal({ transaction, onClose }: ViewTransactionModalProps) {
  const [open, setOpen] = useState(true);

  // Fetch transaction items for this transaction
  const { data: transactionItems, isLoading } = useQuery<TransactionItem[]>({
    queryKey: [`/api/transactions/${transaction.id}/items`],
    enabled: open,
  });

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount / 100);
  };

  // Format date helper
  const formatDate = (date: Date) => {
    return format(new Date(date), "PPP");
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), "p");
  };

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "pending":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Transaction #{transaction.transactionNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-2">Transaction Info</h3>
              <p className="text-xs text-muted-foreground mb-1">Date</p>
              <p className="text-sm mb-2">
                {formatDate(transaction.transactionDate)} at {formatTime(transaction.transactionDate)}
              </p>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-2">
                {getStatusIcon(transaction.status)}
                <Badge
                  variant={
                    transaction.status === "completed"
                      ? "default"
                      : transaction.status === "pending"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {transaction.status.charAt(0).toUpperCase() +
                    transaction.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-2">Patient Information</h3>
              <p className="text-xs text-muted-foreground mb-1">Name</p>
              <p className="text-sm mb-2">{transaction.patientName || "N/A"}</p>
              <p className="text-xs text-muted-foreground mb-1">Patient ID</p>
              <p className="text-sm">{transaction.patientId}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-2">Payment Details</h3>
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-sm font-medium">
                {formatCurrency(transaction.totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground mb-1 mt-2">
                Prescription ID
              </p>
              <p className="text-sm">
                {transaction.prescriptionId || "No Prescription"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="py-4">
          <h3 className="text-sm font-medium mb-4">Transaction Items</h3>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : !transactionItems || transactionItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found in this transaction.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.medicineName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(transaction.totalAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>

        {transaction.notes && (
          <>
            <Separator />
            <div className="py-4">
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{transaction.notes}</p>
            </div>
          </>
        )}

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleDialogClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}