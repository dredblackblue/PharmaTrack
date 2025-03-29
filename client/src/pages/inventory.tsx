import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import MedicineList from "@/components/inventory/medicine-list";
import AddMedicineForm from "@/components/inventory/add-medicine-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus } from "lucide-react";

export default function Inventory() {
  const [location, navigate] = useLocation();
  const isAddPage = location === "/inventory/new";
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-400 mb-1">Inventory Management</h1>
          <p className="text-neutral-300">Manage your medicine inventory</p>
        </div>
        
        {!isAddPage && (
          <Button 
            className="mt-4 md:mt-0 flex items-center"
            onClick={() => navigate("/inventory/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </Button>
        )}
      </div>
      
      {isAddPage ? (
        <AddMedicineForm />
      ) : (
        <Tabs defaultValue="all" className="mt-2">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              All Medicines
            </TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <MedicineList />
          </TabsContent>
          
          <TabsContent value="low-stock">
            <div className="text-center py-8 text-neutral-300">
              Low stock medicines filter will be implemented in a future update.
            </div>
          </TabsContent>
          
          <TabsContent value="expiring">
            <div className="text-center py-8 text-neutral-300">
              Expiring medicines filter will be implemented in a future update.
            </div>
          </TabsContent>
        </Tabs>
      )}
    </Layout>
  );
}
