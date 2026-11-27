import { ArrowUpRight, Sparkles } from "lucide-react";
import Reveal from "./Reveal";
import { STUDIO_FIGURES } from "../../assets/figures";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"];

const SPECS = [
  { value: "Omni Copilot", label: "AI academic support" },
  { value: "Study Rooms", label: "Collaborative hub" },
  { value: "Zen Focus", label: "Productivity engine" },
  { value: "8 Core", label: "Platform highlights" },
];

export default function Hero({ onLaunchApp, onExploreGuest }) {
  const fig = STUDIO_FIGURES.ecosystem;

  const triggerLaunch = (e, mode = "signin") => {
    if (typeof onLaunchApp === "function") {
      e.preventDefault();
      onLaunchApp(mode);
    }
  };

  return (
    <section id="overview" className="relative overflow-hidden border-b border-border/70">
      <div className="pointer-events-none absolute inset-0 grid-field opacity-40" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-primary/[0.07]" />
      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-28 sm:px-6 lg:px-10 lg:pb-24 lg:pt-36">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2.5 border border-border bg-card/80 px-3 py-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="micro text-muted-foreground">AI-powered educational ecosystem</span>
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-8 text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-6xl lg:text-[4.25rem]">
                Learn smarter.
                <br />
                Think deeper.
                <br />
                <span className="text-primary">Master everything.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-8 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                LearnCo turns dense PDFs into instant quizzes, abstract concepts into interactive 3D
                simulations, and solitary revision into collaborative Study Rooms — one continuous
                workspace from raw material to real mastery.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-wrap gap-2">
                {SUBJECTS.map((subject) => (
                  <span
                    key={subject}
                    className="border border-border/90 bg-card/60 px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="#auth-portal"
                  onClick={(e) => triggerLaunch(e, "signin")}
                  className="group inline-flex items-center gap-2.5 bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 cursor-pointer"
                >
                  Start first session
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                <a
                  href="#auth-portal"
                  onClick={(e) => triggerLaunch(e, "signup")}
                  className="inline-flex items-center gap-2 border border-border bg-card px-5 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary cursor-pointer"
                >
                  Create LearnCo account
                </a>
                {onExploreGuest && (
                  <button
                    type="button"
                    onClick={onExploreGuest}
                    className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 px-5 py-3.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 cursor-pointer"
                  >
                    Explore as guest
                  </button>
                )}
                <a href="#ecosystem" className="micro text-muted-foreground underline decoration-border underline-offset-8 transition-colors hover:text-foreground">
                  See what&apos;s inside
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
                {SPECS.map((spec) => (
                  <div key={spec.value} className="bg-background px-4 py-4">
                    <dt className="font-display text-sm font-medium tracking-tight">{spec.value}</dt>
                    <dd className="mt-1 text-[11px] leading-snug text-muted-foreground">{spec.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={0.15} y={30}>
            <div className="relative">
              <div className="absolute -inset-4 border border-border/60" aria-hidden="true" />
              <div className="relative aspect-[4/5] overflow-hidden border border-border bg-card">
                <img
                  src={fig.src}
                  alt={fig.alt}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-background/35" />
                <div className="absolute left-4 top-4 border border-border/80 bg-background/85 px-2.5 py-1 micro text-foreground/85">
                  {fig.code} — {fig.title}
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 border border-border/80 bg-background/90 px-4 py-3">
                  <div>
                    <div className="font-display text-sm font-medium">All-in-one learning ecosystem</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{fig.subtitle}</div>
                  </div>
                  <span className="micro text-primary">{fig.badge}</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
