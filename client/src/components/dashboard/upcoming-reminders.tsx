import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Medicine, Order, Prescription } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

interface Reminder {
  id: number;
  type: string;
  description: string;
  time: string;
}

export default function UpcomingReminders() {
  // Fetch data for reminders
  const { data: medicines } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines/expiring?days=7"],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Generate reminders from real data
  const generateReminders = (): Reminder[] => {
    const reminders: Reminder[] = [];
    
    // Add expiring medicines as reminders
    if (medicines) {
      medicines.slice(0, 2).forEach((medicine, idx) => {
        if (medicine.expiryDate) {
          reminders.push({
            id: idx + 1,
            type: "Expiring Medicine",
            description: `${medicine.name} - Expires soon`,
            time: formatDate(medicine.expiryDate)
          });
        }
      });
    }
    
    // Add orders as reminders
    if (orders) {
      orders.slice(0, 2).forEach((order, idx) => {
        if (order.expectedDeliveryDate) {
          reminders.push({
            id: medicines ? medicines.length + idx + 1 : idx + 100,
            type: "Supply Delivery",
            description: `Order #${order.id} from supplier`,
            time: formatDate(order.expectedDeliveryDate)
          });
        }
      });
    }
    
    // Add a static inventory check reminder if we don't have enough dynamic reminders
    if (reminders.length < 3) {
      reminders.push({
        id: 1000,
        type: "Inventory Check",
        description: "Monthly inventory verification",
        time: "Next Friday, 9:00 AM"
      });
    }
    
    return reminders.slice(0, 3);
  };
  
  const reminders = generateReminders();
  const isLoading = false;

  return (
    <Card className="border border-neutral-100">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg font-bold text-neutral-400">Upcoming Reminders</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="mb-4 pb-4 border-b border-neutral-100 last:border-0 last:mb-0 last:pb-0">
              <div className="flex items-start">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0 mr-3" />
                <div className="w-full">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))
        ) : reminders.length > 0 ? (
          reminders.map((reminder) => (
            <div key={reminder.id} className="mb-4 pb-4 border-b border-neutral-100 last:border-0 last:mb-0 last:pb-0">
              <div className="flex items-start">
                <div className="w-10 h-10 rounded-full bg-neutral-200 flex-shrink-0 mr-3 flex items-center justify-center">
                  <span className="text-neutral-600 font-medium text-sm">
                    {reminder.type.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-400">{reminder.type}</h3>
                  <p className="text-sm text-neutral-300 mb-1">{reminder.description}</p>
                  <p className="text-xs text-primary">{reminder.time}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-neutral-300">
            No upcoming reminders
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary hover:underline text-sm font-medium">
            View All Reminders
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
