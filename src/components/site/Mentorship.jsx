import { Clock, Zap } from "lucide-react";
import Reveal from "./Reveal";
import SectionLabel from "./SectionLabel";
import { STUDIO_FIGURES } from "../../assets/figures";

const SCHEDULE = [
  { day: "Monday", hours: "Closed", open: false },
  { day: "Tuesday", hours: "Closed", open: false },
  { day: "Wednesday", hours: "Closed", open: false },
  { day: "Thursday", hours: "Closed", open: false },
  { day: "Friday", hours: "Closed", open: false },
  { day: "Saturday", hours: "8:00 PM – 10:00 PM", open: true },
  { day: "Sunday", hours: "9:00 AM – 5:00 PM", open: true },
];

const ALWAYS_ON = [
  { title: "Creator Studio & Omni Copilot", desc: "Upload PDFs, generate quizzes and get AI study support any hour, day or night." },
  { title: "Zen Focus, Study Rooms & Labs", desc: "Distraction-free timers, collaborative rooms and 3D STEM simulations whenever you study." },
];

export default function Mentorship() {
  const fig = STUDIO_FIGURES.pavilion;

  return (
    <section id="mentorship" className="relative border-b border-border/70 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-10">
        <Reveal>
          <SectionLabel index="04">Live operations</SectionLabel>
          <h2 className="mt-8 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Mentorship on weekends. Everything else, always.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <div className="border border-border bg-card/40">
              <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
                <Clock className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="micro text-muted-foreground">Synchronous mentorship</span>
              </div>
              <table className="w-full">
                <tbody>
                  {SCHEDULE.map((row) => (
                    <tr key={row.day} className="border-b border-border/60 last:border-0">
                      <th scope="row" className="px-6 py-4 text-left text-[13.5px] font-normal text-foreground/85">{row.day}</th>
                      <td className="px-6 py-4 text-right">
                        <span className={`micro ${row.open ? "text-primary" : "text-muted-foreground/60"}`}>{row.hours}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex h-full flex-col gap-6">
              <div className="border border-border bg-card/40 p-6">
                <div className="flex items-center gap-2.5">
                  <Zap className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  <span className="micro text-primary">24/7 platform access</span>
                </div>
                <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
                  Live mentorship runs on scheduled weekend hours. The AI platform does not sleep.
                </p>
                <ul className="mt-5 space-y-4 border-t border-border/70 pt-5">
                  {ALWAYS_ON.map((item) => (
                    <li key={item.title}>
                      <div className="text-[13.5px] font-medium">{item.title}</div>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative min-h-[210px] flex-1 overflow-hidden border border-border bg-card">
                <img
                  src={fig.src}
                  alt={fig.alt}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 border border-border/80 bg-background/85 px-2.5 py-1 micro text-foreground/85">
                  {fig.code} — {fig.title}
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 border border-border/80 bg-background/90 px-3 py-2">
                  <Zap className="h-3 w-3 text-primary" />
                  <span className="micro">{fig.subtitle}</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
