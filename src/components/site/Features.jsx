import { Bot, Boxes, GraduationCap, ListChecks, Microscope, Sparkles, Timer, UsersRound } from "lucide-react";
import Reveal from "./Reveal";
import SectionLabel from "./SectionLabel";

const FEATURES = [
  { icon: Sparkles, title: "Creator Studio", desc: "Turn a PDF or a web link into structured summaries, clean presentations and concept-based quizzes in a single pass.", badge: "Content engine" },
  { icon: Microscope, title: "Learning Studio", desc: "Structured, interactive learning environments across Mathematics, Physics, Chemistry, Biology and Computer Science.", badge: "STEM curriculum" },
  { icon: Bot, title: "Omni Copilot", desc: "A 24/7 study assistant for instant problem breakdowns, step-by-step explanations and personalised academic support.", badge: "AI assistant" },
  { icon: GraduationCap, title: "Mentorship", desc: "Structured academic guidance with mentor feedback tracking and direct learning assistance when you need a human.", badge: "Guided support" },
  { icon: ListChecks, title: "Practice Questions", desc: "Concept-based problem ladders that build from first principles to exam-level mastery, with retention in mind.", badge: "Mastery testing" },
  { icon: Boxes, title: "Interactive Simulations", desc: "Explore scientific phenomena and mathematical concepts visually through quantitative, interactive simulations.", badge: "3D & WebGL labs" },
  { icon: Timer, title: "Zen Focus Timer", desc: "Distraction-free study sessions that protect your attention and keep you in a working flow state.", badge: "Productivity tool" },
  { icon: UsersRound, title: "Study Rooms", desc: "Collaborative virtual rooms for peer problem-solving, live whiteboarding, group study and quiet co-working.", badge: "Collaborative spaces" },
];

export default function Features() {
  return (
    <section id="ecosystem" className="relative border-b border-border/70 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <Reveal>
          <SectionLabel index="01">Ecosystem highlights</SectionLabel>
          <h2 className="mt-8 max-w-3xl font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            Eight tools built to reduce the friction in how you learn.
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Every part of LearnCo is engineered to remove cognitive friction, deepen conceptual
            understanding and keep your study routine in one place.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 4) * 0.06} className="group bg-background">
              <div className="flex h-full flex-col justify-between gap-10 p-6 transition-colors duration-500 group-hover:bg-card/70">
                <div>
                  <div className="flex items-start justify-between">
                    <feature.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                    <span className="micro text-muted-foreground/50">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="mt-6 font-display text-lg font-medium tracking-tight">{feature.title}</h3>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{feature.desc}</p>
                </div>
                <span className="micro text-muted-foreground/70">{feature.badge}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
