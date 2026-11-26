import Reveal from "./Reveal";

const NOTES = [
  { title: "Stop reading. Start interacting.", desc: "Creator Studio and Interactive Simulations replace passive reading with instant quiz generation and visual 3D concepts." },
  { title: "A 24/7 AI study copilot.", desc: "Omni Copilot and Mentorship mean you never stay stuck on a problem ladder late at night." },
  { title: "Master STEM in the flow zone.", desc: "Concept-based practice, collaborative Study Rooms and Zen Focus Timer combine into deep, distraction-free sessions." },
];

export default function BrandStatement() {
  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-card/30 py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 grid-field opacity-25" />
      <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-6 lg:px-10">
        <Reveal>
          <span className="micro text-muted-foreground">Brand identity</span>
          <blockquote className="mt-8 font-display text-[1.9rem] font-medium leading-[1.15] tracking-[-0.03em] sm:text-5xl">
            “Your AI-powered
            <br />
            <span className="text-primary">learning ecosystem.</span>”
          </blockquote>
          <p className="mx-auto mt-8 max-w-xl text-[14.5px] leading-relaxed text-muted-foreground">
            A comprehensive, modern platform rather than another single-purpose study app — AI content
            creation, interactive labs and collaborative rooms in one authoritative statement.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border border-border bg-border text-left sm:grid-cols-3">
          {NOTES.map((note, i) => (
            <Reveal key={note.title} delay={i * 0.07} className="bg-background">
              <div className="h-full p-6">
                <h3 className="font-display text-[15px] font-medium tracking-tight">{note.title}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{note.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
