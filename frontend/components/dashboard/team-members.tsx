import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "@/components/ui/badge"

export function TeamMembers() {
  const members = [
    {
      name: "Alex Morgan",
      position: "Team Lead",
      status: "Available",
      avatar: "AM",
      statusColor: "bg-green-500",
    },
    {
      name: "Jessica White",
      position: "Senior Developer",
      status: "In Meeting",
      avatar: "JW",
      statusColor: "bg-orange-500",
    },
    {
      name: "Thomas Brown",
      position: "UX Designer",
      status: "Available",
      avatar: "TB",
      statusColor: "bg-green-500",
    },
    {
      name: "Sophia Garcia",
      position: "Business Analyst",
      status: "On Leave",
      avatar: "SG",
      statusColor: "bg-red-500",
    },
    {
      name: "Daniel Martinez",
      position: "Developer",
      status: "Available",
      avatar: "DM",
      statusColor: "bg-green-500",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>Your department team members and their status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${member.avatar}`} />
                  <AvatarFallback>{member.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.position}</p>
                </div>
              </div>
              <Badge variant="outline" className={`flex items-center gap-1 ${member.statusColor}`}>
                <span className={`h-2 w-2 rounded-full ${member.statusColor}`}></span>
                {member.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
