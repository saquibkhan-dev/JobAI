import Link from "next/link";
import { LayoutDashboard, FileText, Kanban, Sparkles } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resumes", label: "Resumes", icon: FileText },
  { href: "/jobs", label: "Job Tracker", icon: Kanban },
  { href: "/ai-tools/cover-letter", label: "AI Tools", icon: Sparkles },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null };
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-muted/30 p-4 md:block">
        <div className="mb-6 px-2 text-lg font-semibold">JobAI</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">
          {user.name ?? user.email}
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
