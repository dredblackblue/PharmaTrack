import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  UserRound,
  DollarSign,
  Truck,
  BarChart3,
  LogOut,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { href: "/inventory", label: "Inventory", icon: <Package className="h-5 w-5 mr-3" /> },
    { href: "/prescriptions", label: "Prescriptions", icon: <FileText className="h-5 w-5 mr-3" /> },
    { href: "/patients", label: "Patients", icon: <Users className="h-5 w-5 mr-3" /> },
    { href: "/doctors", label: "Doctors", icon: <UserRound className="h-5 w-5 mr-3" /> },
    { href: "/billing", label: "Billing", icon: <DollarSign className="h-5 w-5 mr-3" /> },
    { href: "/suppliers", label: "Suppliers", icon: <Truck className="h-5 w-5 mr-3" /> },
    { href: "/reports", label: "Reports", icon: <BarChart3 className="h-5 w-5 mr-3" /> },
  ];
  
  return (
    <aside 
      className={cn(
        "bg-white shadow-lg h-screen flex flex-col drawer-transition", 
        isOpen ? "w-64" : "w-0 md:w-64",
        "md:w-64 fixed md:relative z-20 md:z-0"
      )}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2">
            <span className="text-white font-semibold">P</span>
          </div>
          <h1 className="text-lg font-bold text-primary">PharmaSys</h1>
        </div>
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-neutral-400"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      {user && (
        <div className="flex items-center p-4 border-b">
          <div className="w-10 h-10 rounded-full bg-neutral-200 flex-shrink-0 mr-3 flex items-center justify-center">
            <span className="text-neutral-600 font-medium text-sm">
              {user.fullName.split(' ').map(name => name[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-sm">{user.fullName}</p>
            <p className="text-sm text-neutral-300 capitalize">{user.role}</p>
          </div>
        </div>
      )}
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.href} className={`sidebar-item ${location === item.href ? 'active' : ''}`}>
              <Link 
                href={item.href}
                className={cn(
                  "flex items-center px-6 py-3 text-neutral-400 hover:text-primary",
                  location === item.href && "text-primary"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="flex items-center text-neutral-400 hover:text-primary w-full justify-start px-6"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
