import * as React from "react"
export function Dialog({ children }: { children: React.ReactNode }) { return <>{children}</> }
export function DialogContent({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
export function DialogHeader({ children }: { children: React.ReactNode }) { return <div>{children}</div> }
export function DialogTitle({ children }: { children: React.ReactNode }) { return <h2>{children}</h2> }
