import { Globe, Mail, MapPin, Phone } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type CompanyCardProps = {
  company: {
    companyId: number
    companyName: string
    companyShortName: string
    address: string
    countryName: string
    stateName: string
    postCode: string
    email: string
    phoneNumber: string
    website: string
    logo: string
    modules: Array<{
      moduleId: number
      moduleName: string
    }>
  }
}

export function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border">
            <Image
              src={company.logo || "/placeholder.svg?height=64&width=64"}
              alt={company.companyName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <CardTitle>{company.companyName}</CardTitle>
            <p className="text-sm text-muted-foreground">{company.companyShortName}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span>{company.address}</span>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span>
              {company.stateName}, {company.countryName} - {company.postCode}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span>{company.email}</span>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span>{company.phoneNumber}</span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Active Modules</p>
          <div className="flex flex-wrap gap-2">
            {company.modules.map((module) => (
              <Badge key={module.moduleId} className="bg-green-100 text-green-800 hover:bg-green-200">
                {module.moduleName}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
