import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

const LINKS = [
  { label: "Overview", href: "#overview" },
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Workflow", href: "#workflow" },
  { label: "Mentorship", href: "#mentorship" },
];

export default function SiteHeader({ onLaunchApp }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLaunchClick = (e, mode = "signin") => {
    if (typeof onLaunchApp === "function") {
      e.preventDefault();
      setOpen(false);
      onLaunchApp(mode);
    } else {
      setOpen(false);
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open
          ? "border-b border-border/80 bg-background/95"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:h-20 lg:px-10">
        <a href="#overview" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="relative grid h-8 w-8 place-items-center border border-primary/40 bg-primary/10 transition-colors group-hover:bg-primary/20">
            <span className="h-2 w-2 bg-primary" />
          </span>
          <span className="font-display text-[13px] font-semibold uppercase tracking-[0.3em]">LearnCo</span>
        </a>

        <nav className="hidden items-center gap-9 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="micro text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={(e) => handleLaunchClick(e, "signup")}
            className="hidden items-center border border-border bg-card/80 px-4 py-2.5 micro text-foreground transition-colors hover:border-primary/50 hover:text-primary sm:inline-flex cursor-pointer"
          >
            Create account
          </button>
          <a
            href="#auth-portal"
            onClick={(e) => handleLaunchClick(e, "signin")}
            className="group hidden items-center gap-2 bg-primary px-5 py-2.5 micro font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 sm:inline-flex cursor-pointer"
          >
            Sign in / Launch
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center border border-border text-foreground md:hidden cursor-pointer"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border/80 bg-background/95 px-5 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col">
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="border-b border-border/60 py-4 micro text-muted-foreground">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={(e) => handleLaunchClick(e, "signup")}
              className="flex items-center justify-center border border-border bg-card px-4 py-3 micro font-medium text-foreground cursor-pointer"
            >
              Create account
            </button>
            <a
              href="#auth-portal"
              onClick={(e) => handleLaunchClick(e, "signin")}
              className="flex items-center justify-center gap-2 bg-primary px-4 py-3 micro font-medium text-primary-foreground cursor-pointer"
            >
              Sign in <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
