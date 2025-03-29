import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import PatientList from "@/components/patients/patient-list";
import AddPatientForm from "@/components/patients/add-patient-form";

export default function Patients() {
  const [location, navigate] = useLocation();
  const isAddPage = location === "/patients/new";
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-400 mb-1">Patients</h1>
          <p className="text-neutral-300">Manage patient records</p>
        </div>
        
        {!isAddPage && (
          <Button 
            className="mt-4 md:mt-0 flex items-center"
            onClick={() => navigate("/patients/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        )}
      </div>
      
      {isAddPage ? (
        <AddPatientForm />
      ) : (
        <PatientList />
      )}
    </Layout>
  );
}
