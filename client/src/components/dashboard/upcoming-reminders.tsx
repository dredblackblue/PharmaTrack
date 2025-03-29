import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// This would normally fetch from an API, but for MVP we'll use static data
const reminders = [
  {
    id: 1,
    type: "Prescription Refill",
    description: "James Wilson - Insulin Medication",
    time: "Today, 2:00 PM"
  },
  {
    id: 2,
    type: "Stock Replenishment",
    description: "Order from MedSupply Inc.",
    time: "Tomorrow, 10:00 AM"
  },
  {
    id: 3,
    type: "Inventory Check",
    description: "Monthly inventory verification",
    time: "Friday, 9:00 AM"
  }
];

export default function UpcomingReminders() {
  return (
    <Card className="border border-neutral-100">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg font-bold text-neutral-400">Upcoming Reminders</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        {reminders.map((reminder) => (
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
        ))}
        
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary hover:underline text-sm font-medium">
            View All Reminders
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
