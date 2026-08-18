import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border bg-white py-6 shadow-sm", className)} {...props} />
}
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6 mb-4", className)} {...props} />
}
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-semibold", className)} {...props} />
}
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />
}
export { Card, CardHeader, CardTitle, CardContent }
