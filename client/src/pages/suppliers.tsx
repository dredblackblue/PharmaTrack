import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import SupplierList from "../components/suppliers/supplier-list";
import AddSupplierForm from "../components/suppliers/add-supplier-form";

export default function Suppliers() {
  const [location, navigate] = useLocation();
  const isAddPage = location === "/suppliers/new";
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-400 mb-1">Suppliers</h1>
          <p className="text-neutral-300">Manage your medicine suppliers</p>
        </div>
        
        {!isAddPage && (
          <Button 
            className="mt-4 md:mt-0 flex items-center"
            onClick={() => navigate("/suppliers/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        )}
      </div>
      
      {isAddPage ? (
        <AddSupplierForm />
      ) : (
        <SupplierList />
      )}
    </Layout>
  );
}
