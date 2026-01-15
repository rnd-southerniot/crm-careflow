"use client";

import React from "react";
import DynamicFormRenderer from "./DynamicFormRenderer";
import type { ReportSchema } from "./types";

// Example usage of the DynamicFormRenderer component
const DynamicFormExample: React.FC = () => {
  // Example schema based on the design document
  const exampleSchema: ReportSchema = {
    id: "schema-1",
    productId: "product-1",
    version: 1,
    formStructure: [
      {
        id: "field-1",
        name: "signalStrength",
        label: "Signal Strength (dBm)",
        type: "number" as const,
        required: true,
        validation: [
          {
            type: "min" as const,
            value: -120,
            message: "Signal strength must be above -120 dBm"
          },
          {
            type: "max" as const,
            value: -30,
            message: "Signal strength must be below -30 dBm"
          }
        ],
        order: 1
      },
      {
        id: "field-2",
        name: "installationLocation",
        label: "Installation Location",
        type: "select" as const,
        required: true,
        options: [
          { value: "indoor", label: "Indoor" },
          { value: "outdoor", label: "Outdoor" }
        ],
        order: 2
      },
      {
        id: "field-3",
        name: "technicalNotes",
        label: "Technical Notes",
        type: "textarea" as const,
        required: false,
        validation: [
          {
            type: "max" as const,
            value: 500,
            message: "Notes must not exceed 500 characters"
          }
        ],
        order: 3
      },
      {
        id: "field-4",
        name: "deviceSerial",
        label: "Device Serial Number",
        type: "text" as const,
        required: true,
        validation: [
          {
            type: "pattern" as const,
            value: "^[A-Z0-9]{8,12}$",
            message: "Serial number must be 8-12 uppercase letters and numbers"
          }
        ],
        order: 4
      },
      {
        id: "field-5",
        name: "installationDate",
        label: "Installation Date",
        type: "date" as const,
        required: true,
        order: 5
      },
      {
        id: "field-6",
        name: "powerBackupAvailable",
        label: "Power Backup Available",
        type: "checkbox" as const,
        required: false,
        order: 6
      }
    ]
  };

  const handleSubmit = (data: Record<string, any>) => {
    console.log("Form submitted with data:", data);
    alert("Form submitted successfully! Check console for data.");
  };

  const initialData = {
    signalStrength: -65,
    installationLocation: "indoor",
    powerBackupAvailable: true
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dynamic Form Renderer Example</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <DynamicFormRenderer
          schema={exampleSchema}
          onSubmit={handleSubmit}
          initialData={initialData}
          className="space-y-4"
        />
      </div>
    </div>
  );
};

export default DynamicFormExample;