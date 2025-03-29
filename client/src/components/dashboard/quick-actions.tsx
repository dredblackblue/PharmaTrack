import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Plus,
  FileText,
  Users,
  BarChart4
} from "lucide-react";

export default function QuickActions() {
  const [location, navigate] = useLocation();
  
  const actions = [
    {
      label: "New Prescription",
      icon: <Plus className="h-6 w-6 mb-2" />,
      bgClass: "bg-primary-light bg-opacity-10",
      textClass: "text-primary",
      action: () => navigate("/prescriptions/new")
    },
    {
      label: "Add Medicine",
      icon: <FileText className="h-6 w-6 mb-2" />,
      bgClass: "bg-secondary-light bg-opacity-10",
      textClass: "text-secondary",
      action: () => navigate("/inventory/new")
    },
    {
      label: "New Patient",
      icon: <Users className="h-6 w-6 mb-2" />,
      bgClass: "bg-success bg-opacity-10",
      textClass: "text-success",
      action: () => navigate("/patients/new")
    },
    {
      label: "Generate Report",
      icon: <BarChart4 className="h-6 w-6 mb-2" />,
      bgClass: "bg-neutral-100",
      textClass: "text-neutral-400",
      action: () => navigate("/reports")
    }
  ];
  
  return (
    <Card className="border border-neutral-100 mb-6">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg font-bold text-neutral-400">Quick Actions</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`p-4 ${action.bgClass} rounded-lg flex flex-col items-center justify-center ${action.textClass} h-auto`}
              onClick={action.action}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
