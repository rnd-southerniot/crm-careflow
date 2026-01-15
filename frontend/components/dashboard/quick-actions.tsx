import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Building, Calendar, CalendarDays, Clock, FileText, Settings, Users } from "lucide-react"

interface QuickAction {
  title: string
  icon: string
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  // Map of icon names to components
  const iconMap: Record<string, React.ReactNode> = {
    Building: <Building className="h-4 w-4" />,
    Settings: <Settings className="h-4 w-4" />,
    Users: <Users className="h-4 w-4" />,
    FileText: <FileText className="h-4 w-4" />,
    Calendar: <Calendar className="h-4 w-4" />,
    Clock: <Clock className="h-4 w-4" />,
    CalendarDays: <CalendarDays className="h-4 w-4" />,
    BarChart: <BarChart className="h-4 w-4" />,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {actions.map((action, index) => (
            <Button key={index} variant="outline" className="justify-start">
              {iconMap[action.icon]}
              <span className="ml-2">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
