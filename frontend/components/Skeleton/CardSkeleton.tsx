import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function CardSkeleton() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-full" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-20 w-full rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  )
}
