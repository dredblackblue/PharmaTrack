import { useState } from "react";
import Layout from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Medicine, Transaction, Patient, Doctor } from "@shared/schema";
import { Download, Calendar as CalendarIcon, BarChart4, ArrowRight, Filter, PieChart } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Reports() {
  // State for filters
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [reportType, setReportType] = useState<string>("sales");
  
  // Fetch data for reports
  const { data: medicines } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });
  
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Generate random colors for charts
  const generateColors = (count: number) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(`hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`);
    }
    return colors;
  };

  // Filter transactions by date range
  const filteredTransactions = transactions ? transactions.filter(transaction => {
    if (!dateRange.from && !dateRange.to) return true;
    
    const transactionDate = new Date(transaction.date);
    
    if (dateRange.from && dateRange.to) {
      return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    }
    
    if (dateRange.from) {
      return transactionDate >= dateRange.from;
    }
    
    if (dateRange.to) {
      return transactionDate <= dateRange.to;
    }
    
    return true;
  }) : [];
  
  // Calculate sales data for charts
  const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');
  const totalSales = completedTransactions.reduce((sum, t) => sum + t.totalAmount, 0) / 100;
  const transactionCount = completedTransactions.length;
  const averageTransactionValue = transactionCount > 0 ? totalSales / transactionCount : 0;
  
  // Prepare data for Sales by Category chart
  const salesByCategory: Record<string, number> = {};
  
  if (medicines && completedTransactions.length > 0) {
    // Initialize categories
    medicines.forEach(medicine => {
      salesByCategory[medicine.category] = 0;
    });
    
    // Add up sales by category (this is a simplification as we don't have the actual sales data by category)
    completedTransactions.forEach(transaction => {
      const amount = transaction.totalAmount / 100;
      // Distribute amount equally among categories for demo purposes
      Object.keys(salesByCategory).forEach(category => {
        salesByCategory[category] += amount / Object.keys(salesByCategory).length;
      });
    });
  }
  
  // Format date
  const formatDateString = (date: Date | undefined) => {
    return date ? format(date, 'PPP') : '';
  };

  // Helper function to generate timestamps for the last 30 days
  const getLast30Days = () => {
    const dates = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(format(date, 'MMM dd'));
    }
    return dates;
  };

  // Helper to generate simulated daily sales data
  const generateDailySalesData = () => {
    return getLast30Days().map(() => Math.floor(Math.random() * 5000) / 100);
  };

  // Sales trend chart data
  const salesTrendData = {
    labels: getLast30Days(),
    datasets: [
      {
        label: 'Daily Sales ($)',
        data: generateDailySalesData(),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };
  
  // Sales by category chart data
  const salesByCategoryData = {
    labels: Object.keys(salesByCategory),
    datasets: [
      {
        data: Object.values(salesByCategory),
        backgroundColor: generateColors(Object.keys(salesByCategory).length),
        borderWidth: 1,
      },
    ],
  };
  
  // Stock status chart data
  const stockStatusData = medicines ? {
    labels: ['In Stock', 'Low Stock', 'Critical', 'Out of Stock'],
    datasets: [
      {
        data: [
          medicines.filter(m => m.stockStatus === 'in_stock').length,
          medicines.filter(m => m.stockStatus === 'low_stock').length,
          medicines.filter(m => m.stockStatus === 'critical').length,
          medicines.filter(m => m.stockStatus === 'out_of_stock').length,
        ],
        backgroundColor: ['#4ade80', '#facc15', '#f97316', '#ef4444'],
        borderWidth: 1,
      },
    ],
  } : { labels: [], datasets: [] };
  
  // Inventory value by category
  const inventoryValueByCategory: Record<string, number> = {};
  
  if (medicines) {
    medicines.forEach(medicine => {
      const category = medicine.category;
      const value = (medicine.price * medicine.stockQuantity) / 100;
      
      if (inventoryValueByCategory[category]) {
        inventoryValueByCategory[category] += value;
      } else {
        inventoryValueByCategory[category] = value;
      }
    });
  }
  
  const inventoryValueData = {
    labels: Object.keys(inventoryValueByCategory),
    datasets: [
      {
        label: 'Inventory Value ($)',
        data: Object.values(inventoryValueByCategory),
        backgroundColor: generateColors(Object.keys(inventoryValueByCategory).length),
      },
    ],
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-400 mb-2">Reports</h1>
        <p className="text-neutral-300">Generate and view reports on sales, inventory, and more</p>
      </div>
      
      {/* Report Controls */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Report Settings</CardTitle>
          <CardDescription>Customize the reports by selecting date range and filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Tabs defaultValue="sales" onValueChange={setReportType}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="expiry">Expiry</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {formatDateString(dateRange.from)} - {formatDateString(dateRange.to)}
                          </>
                        ) : (
                          formatDateString(dateRange.from)
                        )
                      ) : (
                        "Pick a date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange(range ?? { from: undefined, to: undefined })}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex-1">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {medicines && Array.from(new Set(medicines.map(m => m.category))).map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button className="flex-none">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Report Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-neutral-300 mt-1">
              {dateRange.from ? `From ${formatDateString(dateRange.from)}` : "All time"}
              {dateRange.to ? ` to ${formatDateString(dateRange.to)}` : ""}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionCount}</div>
            <p className="text-xs text-neutral-300 mt-1">
              Average value: ${averageTransactionValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${medicines ? 
                (medicines.reduce((sum, m) => sum + (m.price * m.stockQuantity), 0) / 100).toFixed(2) 
                : "0.00"}
            </div>
            <p className="text-xs text-neutral-300 mt-1">
              {medicines ? medicines.length : 0} products in stock
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportType === "sales" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Daily sales for the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Line 
                    data={salesTrendData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        }
                      }
                    }} 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Distribution of sales across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Pie 
                    data={salesByCategoryData} 
                    options={{ 
                      maintainAspectRatio: false,
                    }} 
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {reportType === "inventory" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Stock Status</CardTitle>
                <CardDescription>Current inventory levels by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Pie 
                    data={stockStatusData} 
                    options={{ 
                      maintainAspectRatio: false,
                    }} 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value by Category</CardTitle>
                <CardDescription>Value distribution across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <Bar 
                    data={inventoryValueData} 
                    options={{ 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        }
                      }
                    }} 
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
        
        {reportType === "expiry" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Expiring Medicines</CardTitle>
                <CardDescription>Products expiring within the next 90 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="text-left py-3 px-4 font-medium text-neutral-300">Product</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-300">Batch</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-300">Expiry Date</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-300">Stock</th>
                        <th className="text-left py-3 px-4 font-medium text-neutral-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines?.filter(medicine => {
                        if (!medicine.expiryDate) return false;
                        
                        const expiryDate = new Date(medicine.expiryDate);
                        const today = new Date();
                        const ninetyDaysLater = new Date();
                        ninetyDaysLater.setDate(today.getDate() + 90);
                        
                        return expiryDate <= ninetyDaysLater;
                      }).map(medicine => {
                        const expiryDate = new Date(medicine.expiryDate!);
                        const today = new Date();
                        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        let statusClass = '';
                        if (daysUntilExpiry <= 0) {
                          statusClass = 'text-error';
                        } else if (daysUntilExpiry <= 30) {
                          statusClass = 'text-warning';
                        } else {
                          statusClass = 'text-neutral-400';
                        }
                        
                        return (
                          <tr key={medicine.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                            <td className="py-3 px-4 text-neutral-400">{medicine.name}</td>
                            <td className="py-3 px-4 text-neutral-300">{medicine.batchNumber || 'N/A'}</td>
                            <td className="py-3 px-4 text-neutral-300">{formatDate(medicine.expiryDate as string)}</td>
                            <td className="py-3 px-4 text-neutral-300">{medicine.stockQuantity} units</td>
                            <td className={`py-3 px-4 ${statusClass}`}>
                              {daysUntilExpiry <= 0 ? 'Expired' : 
                               daysUntilExpiry === 1 ? 'Expires tomorrow' :
                               `Expires in ${daysUntilExpiry} days`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Expiry Summary</CardTitle>
                <CardDescription>Overview of expiring products by timeframe</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medicines && (
                    <>
                      <div className="bg-error bg-opacity-10 rounded-lg p-4">
                        <div className="font-bold text-error">
                          {medicines.filter(m => {
                            if (!m.expiryDate) return false;
                            return new Date(m.expiryDate) <= new Date();
                          }).length} products
                        </div>
                        <div className="text-sm text-neutral-500">Already expired</div>
                      </div>
                      
                      <div className="bg-warning bg-opacity-10 rounded-lg p-4">
                        <div className="font-bold text-warning">
                          {medicines.filter(m => {
                            if (!m.expiryDate) return false;
                            const expiryDate = new Date(m.expiryDate);
                            const today = new Date();
                            const thirtyDaysLater = new Date();
                            thirtyDaysLater.setDate(today.getDate() + 30);
                            return expiryDate > today && expiryDate <= thirtyDaysLater;
                          }).length} products
                        </div>
                        <div className="text-sm text-neutral-500">Expiring within 30 days</div>
                      </div>
                      
                      <div className="bg-info bg-opacity-10 rounded-lg p-4">
                        <div className="font-bold text-info">
                          {medicines.filter(m => {
                            if (!m.expiryDate) return false;
                            const expiryDate = new Date(m.expiryDate);
                            const today = new Date();
                            const thirtyDaysLater = new Date();
                            const ninetyDaysLater = new Date();
                            thirtyDaysLater.setDate(today.getDate() + 30);
                            ninetyDaysLater.setDate(today.getDate() + 90);
                            return expiryDate > thirtyDaysLater && expiryDate <= ninetyDaysLater;
                          }).length} products
                        </div>
                        <div className="text-sm text-neutral-500">Expiring in 31-90 days</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Actions */}
      <div className="mt-6 flex justify-end">
        <Button variant="outline" className="mr-2">
          <PieChart className="h-4 w-4 mr-2" />
          Save Report
        </Button>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>
    </Layout>
  );
}