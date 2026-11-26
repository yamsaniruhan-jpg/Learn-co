const APP_URL = "https://learn-co.ai.studio/";

const COLUMNS = [
  { heading: "Platform", links: [{ label: "Overview", href: "#overview" }, { label: "Ecosystem", href: "#ecosystem" }, { label: "Workflow", href: "#workflow" }, { label: "Mentorship", href: "#mentorship" }] },
  { heading: "Tools", links: [{ label: "Creator Studio", href: "#ecosystem" }, { label: "Omni Copilot", href: "#ecosystem" }, { label: "Interactive Simulations", href: "#ecosystem" }, { label: "Zen Focus Timer", href: "#ecosystem" }] },
  { heading: "Subjects", links: [{ label: "Mathematics", href: "#ecosystem" }, { label: "Physics", href: "#ecosystem" }, { label: "Chemistry", href: "#ecosystem" }, { label: "Computer Science", href: "#ecosystem" }] },
];

export default function SiteFooter({ onLaunchApp }) {
  const handleLaunch = (e) => {
    if (typeof onLaunchApp === "function") {
      e.preventDefault();
      onLaunchApp("signin");
    }
  };

  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center border border-primary/40 bg-primary/10">
                <span className="h-2 w-2 bg-primary" />
              </span>
              <span className="font-display text-[13px] font-semibold uppercase tracking-[0.3em]">LearnCo</span>
            </div>
            <p className="mt-5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              AI-powered learning and productivity for high-school, AP and college STEM students.
            </p>
            <a
              href="#auth-portal"
              onClick={handleLaunch}
              className="mt-6 inline-flex micro text-primary underline decoration-primary/40 underline-offset-4 cursor-pointer"
            >
              Sign in / Open Workspace
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.heading}>
                <h3 className="micro text-foreground/70">{column.heading}</h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="micro text-muted-foreground/60">© {new Date().getFullYear()} LearnCo. All rights reserved.</span>
          <span className="micro text-muted-foreground/60">Smart content • Study Rooms • Focus tools</span>
        </div>
      </div>
    </footer>
  );
}
