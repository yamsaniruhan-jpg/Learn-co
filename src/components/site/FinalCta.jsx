import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";

export default function FinalCta({ onLaunchApp }) {
  const handleLaunchClick = (e, mode = "signin") => {
    if (typeof onLaunchApp === "function") {
      e.preventDefault();
      onLaunchApp(mode);
    }
  };

  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 grid-field opacity-30" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-10 border border-border bg-card/50 p-8 sm:p-12 lg:flex-row lg:items-center">
            <div>
              <span className="micro text-muted-foreground">Ready when you are</span>
              <h2 className="mt-5 max-w-xl font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
                Start your first session by signing in or creating a LearnCo account.
              </h2>
              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                No setup ritual. Bring a PDF, a problem set or a blank page — Omni Copilot meets you
                wherever the work begins.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href="#auth-portal"
                onClick={(e) => handleLaunchClick(e, "signin")}
                className="group inline-flex shrink-0 items-center gap-2.5 bg-primary px-7 py-4 micro font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 cursor-pointer"
              >
                Sign in to LearnCo
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <button
                type="button"
                onClick={(e) => handleLaunchClick(e, "signup")}
                className="inline-flex shrink-0 items-center border border-border bg-card px-6 py-4 micro font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary cursor-pointer"
              >
                Create account
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
