import Reveal from "./Reveal";
import SectionLabel from "./SectionLabel";
import { STUDIO_FIGURES } from "../../assets/figures";

const STEPS = [
  { title: "Ingest & summarise", desc: "Drop PDFs or URLs into Creator Studio and get instant study notes, presentations and quizzes." },
  { title: "Visualise & practise", desc: "Test the concept with practice ladders and dynamic 3D simulations before it slips away." },
  { title: "Ask Omni Copilot", desc: "Get context-aware explanations the moment a step stops making sense." },
  { title: "Focus & collaborate", desc: "Run Zen Focus sessions, join Study Rooms and track mentor feedback in one loop." },
];

export default function Workflow() {
  const fig = STUDIO_FIGURES.simulation;

  return (
    <section id="workflow" className="relative border-b border-border/70 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal>
              <SectionLabel index="02">Connected workflow</SectionLabel>
              <h2 className="mt-8 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Four moves. One continuous loop.
              </h2>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Instead of jumping between disconnected tabs, note apps and search engines, LearnCo
                links every step of your study workflow into a single feedback loop.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="relative mt-10 aspect-[3/2] overflow-hidden border border-border bg-card">
                <img
                  src={fig.src}
                  alt={fig.alt}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
                <div className="absolute left-4 top-4 border border-border/80 bg-background/85 px-2.5 py-1 micro text-foreground/85">
                  {fig.code} — {fig.title}
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between border border-border/80 bg-background/90 px-3.5 py-2.5">
                  <span className="text-xs font-medium text-foreground">{fig.subtitle}</span>
                  <span className="micro text-primary">{fig.badge}</span>
                </div>
              </div>
            </Reveal>
          </div>

          <ol className="relative">
            <span className="absolute left-[15px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06}>
                <li className="relative flex gap-6 pb-10 last:pb-0">
                  <span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center border border-border bg-background micro text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-display text-lg font-medium tracking-tight">{step.title}</h3>
                    <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">{step.desc}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
