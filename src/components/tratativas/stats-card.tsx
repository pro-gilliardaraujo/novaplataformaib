import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react"

type StatsCardProps = {
  title: string
  value: string
  icon: "total" | "pending" | "completed" | "canceled"
}

const icons = {
  total: Calendar,
  pending: Clock,
  completed: CheckCircle,
  canceled: XCircle,
}

const colors = {
  total: "text-blue-600",
  pending: "text-yellow-600",
  completed: "text-green-600",
  canceled: "text-red-600",
}

export function StatsCard({ title, value, icon }: StatsCardProps) {
  const Icon = icons[icon]

  return (
    <Card className="p-2">
      <CardContent className="flex items-center justify-between p-0">
        <div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
          <p className={`text-base sm:text-lg font-bold ${colors[icon]}`}>{value}</p>
        </div>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors[icon]}`} />
      </CardContent>
    </Card>
  )
} 