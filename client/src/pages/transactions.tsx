import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "../components/layout/layout";
import TransactionList from "../components/transactions/transaction-list";
import AddTransactionForm from "../components/transactions/add-transaction-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function Transactions() {
  const [location, navigate] = useLocation();
  const isAddPage = location === "/transactions/new";
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-400 mb-1">Transactions</h1>
          <p className="text-neutral-300">Manage patient transactions and payments</p>
        </div>
        
        {!isAddPage && (
          <Button 
            className="mt-4 md:mt-0 flex items-center"
            onClick={() => navigate("/transactions/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        )}
      </div>
      
      {isAddPage ? (
        <AddTransactionForm />
      ) : (
        <TransactionList />
      )}
    </Layout>
  );
}