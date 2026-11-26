import { Check } from "lucide-react";
import Reveal from "./Reveal";
import SectionLabel from "./SectionLabel";

const PILLARS = [
  { index: "01", title: "What LearnCo is", desc: "A next-generation AI learning ecosystem that unifies material creation, subject mastery, AI tutoring, interactive simulations, Study Rooms and focus management in one platform.", points: ["Complete all-in-one study hub", "Built for high-school, AP and college STEM", "Integrated Study Rooms & focus engine"] },
  { index: "02", title: "What makes it different", desc: "Unlike static video courses or passive flashcards, LearnCo makes study material active. Documents become quizzes, hard concepts become simulations, and Copilot tutors in real time.", points: ["Instant PDF & URL transformation", "Visual 3D concept simulations", "Contextual Omni Copilot assistance"] },
  { index: "03", title: "Why students use it", desc: "LearnCo removes study friction and protects deep work. Less time formatting notes, more time gaining genuine understanding through practice and feedback.", points: ["Up to 3× faster study prep", "Higher retention through active recall", "Collaborative rooms & Zen Focus flow"] },
];

export default function Pillars() {
  return (
    <section className="relative border-b border-border/70 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <Reveal>
          <SectionLabel index="03">Positioning</SectionLabel>
          <h2 className="mt-8 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Three pillars, one platform.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.index} delay={i * 0.08}>
              <div className="flex h-full flex-col border border-border bg-card/40 p-7 transition-colors hover:border-primary/40 hover:bg-card/70">
                <span className="micro text-primary">{pillar.index}</span>
                <h3 className="mt-6 font-display text-xl font-medium tracking-tight">{pillar.title}</h3>
                <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">{pillar.desc}</p>
                <ul className="mt-7 space-y-3 border-t border-border/70 pt-6">
                  {pillar.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-[13px] text-foreground/85">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
