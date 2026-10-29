import { Link } from "@tanstack/react-router";
import { BookOpen, Heart, History, PanelLeftClose, PanelLeftOpen, Stethoscope } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDessertJournal } from "@/hooks/use-dessert-journal";

export function WorkspaceNav() {
  const [collapsed, setCollapsed] = useState(false);
  const { cases, reviews } = useDessertJournal();
  const items = [
    { to: "/", label: "Companion", icon: Heart, count: 0 },
    { to: "/mentor", label: "Medical Mentor", icon: Stethoscope, count: 0 },
    { to: "/journal", label: "Case Journal", icon: BookOpen, count: cases.length },
    { to: "/learning", label: "Learning History", icon: History, count: reviews.length },
  ] as const;
  return <div className="w-full shrink-0">
    <div className="mb-2 hidden items-center justify-between lg:flex">
      <span className="text-xs text-muted-foreground">{collapsed ? "Workspace" : "DESSERT / WORKSPACE"}</span>
      <Button variant="ghost" size="icon" title={collapsed ? "Expand navigation" : "Collapse navigation"} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button>
    </div>
    <nav aria-label="Workspace" className={`grid grid-cols-4 gap-1 ${collapsed ? "lg:grid-cols-4" : "lg:grid-cols-2"}`}>
      {items.map(({ to, label, icon: Icon, count }) => <Button key={to} asChild variant="ghost" className="h-auto min-h-10 min-w-0 px-1 py-2 lg:px-2">
        <Link to={to} title={label} className="flex flex-col gap-1 text-muted-foreground lg:flex-row lg:flex-wrap" activeOptions={{ exact: true }} activeProps={{ className: "bg-primary/15 text-primary" }}>
          <Icon className="size-4 shrink-0" /><span className={`text-[10px] leading-tight sm:text-xs ${collapsed ? "lg:hidden" : ""}`}>{label}</span>
          {count > 0 && <span className="hidden text-xs lg:inline">{count}</span>}
        </Link>
      </Button>)}
    </nav>
  </div>;
}