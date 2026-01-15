import { Building, Globe, MapPin, Phone } from "lucide-react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type BranchCardProps = {
  location: {
    id: number
    name: string
    shortName: string
    address: string
    countryName: string
    stateName: string
    postCode: string
    phoneNumber: string
    image: string | null
  }
}

export function BranchCard({ location }: BranchCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-muted relative">
        {location.image ? (
          <Image src={location.image || "/placeholder.svg"} alt={location.name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building className="h-12 w-12 text-muted-foreground opacity-20" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg">{location.name}</h3>
        <p className="text-sm text-muted-foreground">{location.shortName}</p>
        <Separator className="my-3" />
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span>{location.address}</span>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span>
              {location.stateName}, {location.countryName} - {location.postCode}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <span>{location.phoneNumber}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
