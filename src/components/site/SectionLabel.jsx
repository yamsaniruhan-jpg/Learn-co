export default function SectionLabel({ index, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-1.5 w-1.5 shrink-0 bg-primary" />
      {index ? <span className="micro text-muted-foreground/70">{index}</span> : null}
      <span className="micro text-muted-foreground">{children}</span>
      <span className="h-px flex-1 bg-border/70" />
    </div>
  );
}
