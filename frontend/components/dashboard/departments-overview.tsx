"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

export function DepartmentsOverview() {
  const data = [
    { name: "HR", employees: 12, budget: 80 },
    { name: "IT", employees: 42, budget: 95 },
    { name: "Finance", employees: 18, budget: 75 },
    { name: "Marketing", employees: 22, budget: 85 },
    { name: "Operations", employees: 35, budget: 90 },
    { name: "Sales", employees: 28, budget: 88 },
    { name: "R&D", employees: 15, budget: 92 },
    { name: "Customer Support", employees: 32, budget: 78 },
  ]

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Departments Overview</CardTitle>
        <CardDescription>Employee count and budget utilization by department</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="min-h-[300px]">
          <ChartContainer
            config={{
              employees: {
                label: "Employees",
                color: "hsl(var(--chart-1))",
              },
              budget: {
                label: "Budget Utilization %",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="var(--color-employees)" />
                <YAxis yAxisId="right" orientation="right" stroke="var(--color-budget)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar yAxisId="left" dataKey="employees" fill="var(--color-employees)" />
                <Bar yAxisId="right" dataKey="budget" fill="var(--color-budget)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
