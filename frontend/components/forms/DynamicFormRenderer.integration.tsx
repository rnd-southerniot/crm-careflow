"use client";

import React, { useState, useEffect } from "react";
import { DynamicFormRenderer } from "./index";
import { reportsApi, workflowApi } from "@/services/api";
import type { ReportSchema } from "./types";

interface TechnicalReportFormProps {
  taskId: string;
  productId: string;
  onSubmitSuccess?: (data: Record<string, any>) => void;
  onSubmitError?: (error: Error) => void;
}

/**
 * Integration component that demonstrates how to use DynamicFormRenderer
 * with the CRM system's API for technical report submission.
 * 
 * This component:
 * 1. Fetches the report schema for a specific product
 * 2. Renders the dynamic form based on the schema
 * 3. Submits the form data to the backend API
 * 4. Handles loading states and errors
 */
export const TechnicalReportForm: React.FC<TechnicalReportFormProps> = ({
  taskId,
  productId,
  onSubmitSuccess,
  onSubmitError
}) => {
  const [schema, setSchema] = useState<ReportSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Record<string, any>>({});

  // Fetch report schema and existing data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch the report schema for this product
        const schemaResponse = await reportsApi.getReportSchema(productId);
        setSchema(schemaResponse);

        // Optionally fetch existing report data if this is an edit
        try {
          const task = await workflowApi.getTask(taskId);
          const existingReport = task.technicalReports?.[0];
          if (existingReport) {
            setInitialData(existingReport.submissionData);
          }
        } catch (taskError) {
          // Task might not exist yet or no existing report - that's okay
          console.log("No existing report data found");
        }

      } catch (err) {
        console.error("Failed to fetch report schema:", err);
        setError("Failed to load form schema. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [taskId, productId]);

  // Handle form submission
  const handleSubmit = async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Submit the technical report
      const result = await reportsApi.submitTechnicalReport(taskId, formData);
      
      console.log("Technical report submitted successfully:", result);
      onSubmitSuccess?.(formData);

    } catch (err) {
      console.error("Failed to submit technical report:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit report";
      setError(errorMessage);
      onSubmitError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading form...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No schema available
  if (!schema) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No Form Schema</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>No report schema is configured for this product.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the dynamic form
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900">Technical Report</h2>
          <p className="mt-1 text-sm text-gray-600">
            Complete the technical report for this onboarding task.
          </p>
        </div>

        <DynamicFormRenderer
          schema={schema}
          onSubmit={handleSubmit}
          initialData={initialData}
          isLoading={isSubmitting}
          className="space-y-4"
        />
      </div>

      {/* Submission feedback */}
      {isSubmitting && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">Submitting technical report...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalReportForm;