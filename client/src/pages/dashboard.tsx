import { useEffect } from "react";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import StatCard from "@/components/dashboard/stat-card";
import LowStockAlert from "@/components/dashboard/low-stock-alert";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import ExpiryAlerts from "@/components/dashboard/expiry-alerts";
import QuickActions from "@/components/dashboard/quick-actions";
import UpcomingReminders from "@/components/dashboard/upcoming-reminders";
import { useQuery } from "@tanstack/react-query";
import { Medicine, Transaction } from "@shared/schema";
import { Package, AlertTriangle, FileText, DollarSign } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch medicines for stats
  const { data: medicines } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  // Fetch transactions for stats
  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Calculate stats
  const totalMedicines = medicines?.length || 0;
  const lowStockMedicines = medicines?.filter(m => 
    m.stockStatus === 'low_stock' || m.stockStatus === 'critical'
  ).length || 0;
  
  const totalPrescriptions = transactions?.filter(t => t.prescriptionId !== null).length || 0;
  
  const totalRevenue = transactions?.reduce((sum, t) => 
    t.status === 'completed' ? sum + t.totalAmount : sum, 0
  ) || 0;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-400 mb-1">Dashboard</h1>
        <p className="text-neutral-300">Welcome back, {user?.fullName}</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Medicines"
          value={totalMedicines}
          icon={<Package className="h-6 w-6" />}
          iconBgColor="bg-primary-light bg-opacity-10"
          iconColor="text-primary"
          trend={{ value: "4.2% from last month", positive: true }}
        />
        
        <StatCard
          title="Low Stock"
          value={lowStockMedicines}
          icon={<AlertTriangle className="h-6 w-6" />}
          iconBgColor="bg-warning bg-opacity-10"
          iconColor="text-warning"
          trend={{ value: "2.5% from last week", positive: false }}
        />
        
        <StatCard
          title="Prescriptions"
          value={totalPrescriptions}
          icon={<FileText className="h-6 w-6" />}
          iconBgColor="bg-secondary-light bg-opacity-10"
          iconColor="text-secondary"
          trend={{ value: "7.8% from last month", positive: true }}
        />
        
        <StatCard
          title="Revenue"
          value={`$${(totalRevenue / 100).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
          iconBgColor="bg-success bg-opacity-10"
          iconColor="text-success"
          trend={{ value: "3.1% from last month", positive: true }}
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2">
          <LowStockAlert />
          <RecentTransactions />
        </div>
        
        {/* Right Column */}
        <div className="lg:col-span-1">
          <ExpiryAlerts />
          <QuickActions />
          <UpcomingReminders />
        </div>
      </div>
    </Layout>
  );
}
