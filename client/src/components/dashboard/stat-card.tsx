import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  trend
}: StatCardProps) {
  return (
    <Card className="border border-neutral-100">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-neutral-300 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-neutral-400">{value}</h3>
            
            {trend && (
              <p className={cn(
                "text-xs flex items-center mt-1",
                trend.positive ? "text-success" : "text-error"
              )}>
                {trend.positive ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {trend.value}
              </p>
            )}
          </div>
          
          <div className={cn("p-2 rounded-lg", iconBgColor)}>
            <div className={cn("h-6 w-6", iconColor)}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
