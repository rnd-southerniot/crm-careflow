import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

interface RecentActivitiesProps {
  isGlobal: boolean
}

export function RecentActivities({ isGlobal }: RecentActivitiesProps) {
  // Different activities based on whether this is for super-admin (global) or admin
  const activities = isGlobal
    ? [
        {
          user: "Sarah Johnson",
          department: "HR",
          action: "Added new employee",
          target: "Michael Brown",
          time: "2 hours ago",
          avatar: "SJ",
        },
        {
          user: "David Lee",
          department: "IT",
          action: "Updated system settings",
          target: "Security protocols",
          time: "3 hours ago",
          avatar: "DL",
        },
        {
          user: "Emily Chen",
          department: "Finance",
          action: "Approved expense report",
          target: "$12,450",
          time: "5 hours ago",
          avatar: "EC",
        },
        {
          user: "Robert Wilson",
          department: "Operations",
          action: "Created new project",
          target: "Q2 Optimization",
          time: "Yesterday",
          avatar: "RW",
        },
        {
          user: "Jennifer Taylor",
          department: "Marketing",
          action: "Launched campaign",
          target: "Summer Promotion",
          time: "Yesterday",
          avatar: "JT",
        },
      ]
    : [
        {
          user: "Alex Morgan",
          department: "Your Department",
          action: "Submitted timesheet",
          target: "Week 23",
          time: "1 hour ago",
          avatar: "AM",
        },
        {
          user: "Jessica White",
          department: "Your Department",
          action: "Requested leave",
          target: "June 15-20",
          time: "3 hours ago",
          avatar: "JW",
        },
        {
          user: "Thomas Brown",
          department: "Your Department",
          action: "Completed task",
          target: "Quarterly report",
          time: "4 hours ago",
          avatar: "TB",
        },
        {
          user: "Sophia Garcia",
          department: "Your Department",
          action: "Updated project status",
          target: "Client presentation",
          time: "Yesterday",
          avatar: "SG",
        },
        {
          user: "Daniel Martinez",
          department: "Your Department",
          action: "Added comment",
          target: "Team meeting notes",
          time: "Yesterday",
          avatar: "DM",
        },
      ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>
          {isGlobal ? "Latest activities across all departments" : "Latest activities in your department"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${activity.avatar}`} />
                <AvatarFallback>{activity.avatar}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  <span className="font-semibold">{activity.user}</span>
                  {isGlobal && <span className="ml-2 text-xs text-muted-foreground">({activity.department})</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.action}: <span className="font-medium text-foreground">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
