import * as React from "react"
export function Tabs({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
export function TabsList({ children }: { children: React.ReactNode }) { return <div className="flex gap-2">{children}</div> }
export function TabsTrigger({ children }: { children: React.ReactNode }) { return <button type="button">{children}</button> }
export function TabsContent({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
