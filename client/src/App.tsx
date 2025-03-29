import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout/layout";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import Prescriptions from "@/pages/prescriptions";
import Patients from "@/pages/patients";
import Doctors from "@/pages/doctors";
import Billing from "@/pages/billing";
import Suppliers from "@/pages/suppliers";
import Transactions from "@/pages/transactions";
import Orders from "@/pages/orders";
import Reports from "@/pages/reports";
import Profile from "@/pages/profile";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/inventory" component={Inventory} />
      <ProtectedRoute path="/inventory/new" component={Inventory} />
      <ProtectedRoute path="/prescriptions" component={Prescriptions} />
      <ProtectedRoute path="/patients" component={Patients} />
      <ProtectedRoute path="/patients/new" component={Patients} />
      <ProtectedRoute path="/doctors" component={Doctors} />
      <ProtectedRoute path="/billing" component={Billing} />
      <ProtectedRoute path="/suppliers" component={Suppliers} />
      <ProtectedRoute path="/suppliers/new" component={Suppliers} />
      <ProtectedRoute path="/transactions" component={Transactions} />
      <ProtectedRoute path="/transactions/new" component={Transactions} />
      <ProtectedRoute path="/orders" component={Orders} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/profile" component={Profile} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
