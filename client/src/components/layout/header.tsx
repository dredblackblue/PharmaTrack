import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Menu,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, navigate] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log("Searching for:", searchQuery);
  };
  
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-neutral-400 mr-2"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <form onSubmit={handleSearch} className="relative w-64 md:w-80">
          <Input
            type="text"
            className="w-full px-4 py-2 pr-8 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary text-sm"
            placeholder="Search medicines, patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            type="submit"
            variant="ghost" 
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-neutral-300"
          >
            <Search className="h-5 w-5" />
          </Button>
        </form>
        
        <div className="flex items-center">
          <div className="relative mr-3">
            <Button variant="ghost" size="icon" className="relative text-neutral-400 hover:bg-neutral-100 rounded-full">
              <Bell className="h-6 w-6" />
              <Badge className="absolute top-1 right-1 bg-destructive h-4 w-4 p-0 flex items-center justify-center text-xs">
                3
              </Badge>
            </Button>
          </div>
          
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center focus:outline-none">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 flex-shrink-0 mr-2 flex items-center justify-center">
                    <span className="text-neutral-600 font-medium text-sm">
                      {user?.fullName.split(' ').map(name => name[0]).join('')}
                    </span>
                  </div>
                  <span className="text-sm font-medium mr-1">{user?.fullName}</span>
                  <ChevronDown className="h-4 w-4 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
