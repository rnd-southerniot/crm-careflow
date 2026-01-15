import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"

interface Stat {
  title: string
  value: string
  change: string
  changeType: "increase" | "decrease" | "neutral"
}

interface DashboardStatsProps {
  stats: Stat[]
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="mt-1 flex items-center text-xs">
              {stat.changeType === "increase" ? (
                <ArrowUp className="mr-1 h-4 w-4 text-emerald-500" />
              ) : stat.changeType === "decrease" ? (
                <ArrowDown className="mr-1 h-4 w-4 text-rose-500" />
              ) : null}
              <span
                className={
                  stat.changeType === "increase"
                    ? "text-emerald-500"
                    : stat.changeType === "decrease"
                      ? "text-rose-500"
                      : ""
                }
              >
                {stat.change} from last month
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
