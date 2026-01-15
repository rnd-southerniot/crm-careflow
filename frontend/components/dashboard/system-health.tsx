"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

export function SystemHealth() {
  const data = [
    { name: "Operational", value: 85 },
    { name: "Warning", value: 10 },
    { name: "Critical", value: 5 },
  ]

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"]

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Current status of all system components</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer
            config={{
              operational: {
                label: "Operational",
                color: "#10b981",
              },
              warning: {
                label: "Warning",
                color: "#f59e0b",
              },
              critical: {
                label: "Critical",
                color: "#ef4444",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
