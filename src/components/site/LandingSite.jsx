import SiteHeader from "./SiteHeader";
import Hero from "./Hero";
import Features from "./Features";
import Workflow from "./Workflow";
import Pillars from "./Pillars";
import BrandStatement from "./BrandStatement";
import Mentorship from "./Mentorship";
import FinalCta from "./FinalCta";
import SiteFooter from "./SiteFooter";

export default function LandingSite({ authSlot, pwaInstallSlot, onOpenAuth }) {
  const handleLaunchApp = (mode = "signin") => {
    if (typeof onOpenAuth === "function") {
      onOpenAuth(mode);
      return;
    }
    const el = document.getElementById("auth-portal");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="landing-site min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <SiteHeader onLaunchApp={handleLaunchApp} />
      <main>
        <Hero onLaunchApp={handleLaunchApp} />
        <Features />
        <Workflow />
        <Pillars />
        <BrandStatement />
        <Mentorship />
        <FinalCta onLaunchApp={handleLaunchApp} />
        {authSlot ? (
          <section id="auth-portal" className="border-t border-border/70 bg-card/30 py-20 lg:py-24">
            <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-10">
              <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 shrink-0 bg-primary" />
                    <span className="micro text-muted-foreground">Workspace access</span>
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    Start your first session — sign in or create a LearnCo account.
                  </h2>
                </div>
                {pwaInstallSlot ? <div className="shrink-0">{pwaInstallSlot}</div> : null}
              </div>
              <div className="border border-border bg-[#FFFFFF] dark:bg-[#111114] text-[#2D2A4A] dark:text-[#F4F4F6] p-4 sm:p-8 shadow-sm">
                {authSlot}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter onLaunchApp={handleLaunchApp} />
    </div>
  );
}
