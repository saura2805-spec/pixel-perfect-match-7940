import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, History, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkspaceNav } from "./WorkspaceNav";
import { useDessertJournal } from "@/hooks/use-dessert-journal";
import { caseSchema, reviewSchema } from "@/lib/dessert-journal";

export function JournalScreen({ learning = false }: { learning?: boolean }) {
  const journal = useDessertJournal();
  const [caseId, setCaseId] = useState("none");
  const [status, setStatus] = useState("");
  const count = learning ? journal.reviews.length : journal.cases.length;
  const fields = learning ? [
    { name: "initialDiagnosis", label: "Initial diagnosis", placeholder: "What did you initially think?", required: true },
    { name: "revisedDiagnosis", label: "Final or revised diagnosis", placeholder: "What was established after review?", required: true },
    { name: "error", label: "Reasoning error or missed clue", placeholder: "What finding or assumption changed your reasoning?", area: true, required: true },
    { name: "lesson", label: "Lesson for future cases", placeholder: "What should you check or consider next time?", area: true, required: true },
  ] : [
    { name: "title", label: "Case title", placeholder: "e.g. Fever with thrombocytopenia", required: true },
    { name: "history", label: "History and examination", placeholder: "Presenting complaint, timeline, relevant findings…", area: true, required: true },
    { name: "diagnosis", label: "Working diagnosis", placeholder: "Leave undetermined if unknown" },
    { name: "reasoning", label: "Clinical reasoning", placeholder: "Evidence for and against your differential…", area: true },
    { name: "lessons", label: "Key lessons", placeholder: "What will you remember next time?", area: true },
  ];
  return <div className="mx-auto grid min-h-dvh max-w-7xl gap-4 p-3 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
    <aside className="flex flex-col border-b pb-4 lg:border-r lg:border-b-0 lg:pr-6">
      <Link to="/" className="mb-4 font-display text-3xl italic text-primary">Dessert</Link>
      <WorkspaceNav />
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground lg:mt-auto">Local notes · stored in this browser</p>
    </aside>
    <main className="min-w-0 lg:px-4">
      <header className="flex items-start justify-between gap-4 border-b pb-6">
        <div><p className="mb-2 text-xs text-muted-foreground">DESSERT / {learning ? "LEARNING HISTORY" : "CASE JOURNAL"}</p><h1 className="font-display text-3xl">{learning ? "Your learning journey" : "Clinical case journal"}</h1></div>
        <span className="shrink-0 rounded-md border px-3 py-2 text-xs text-muted-foreground">{count} {learning ? "reviews" : "cases"}</span>
      </header>
      <div className="py-6"><h2 className="text-lg font-semibold">{learning ? "Learn from every case" : "Your cases"}</h2><p className="mt-1 text-sm text-muted-foreground">{learning ? "Document reviewed mistakes and lessons to revisit." : "Use fictional or de-identified case information only."}</p></div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <form className="space-y-5" onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const data = Object.fromEntries(new FormData(form));
          const base = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
          const parsed = learning ? reviewSchema.safeParse({ ...base, caseId: caseId === "none" ? "" : caseId }) : caseSchema.safeParse(base);
          if (!parsed.success) { setStatus("Please complete the required fields."); return; }
          const saved = "title" in parsed.data ? journal.addCase(parsed.data) : journal.addReview(parsed.data);
          if (saved) { form.reset(); setCaseId("none"); setStatus(learning ? "Learning review saved in this browser." : "Case saved in this browser."); }
        }}>
          <h3 className="flex items-center gap-2 font-semibold"><Plus className="size-4 text-primary" />{learning ? "Record a learning review" : "Add a clinical case"}</h3>
          {learning && <div className="space-y-2"><Label htmlFor="related-case">Related case (optional)</Label><Select value={caseId} onValueChange={setCaseId}><SelectTrigger id="related-case"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No linked case</SelectItem>{journal.cases.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select></div>}
          {fields.map((field) => <div key={field.name} className="space-y-2"><Label htmlFor={field.name}>{field.label}{field.required ? " *" : ""}</Label>{field.area ? <Textarea id={field.name} name={field.name} required={field.required} placeholder={field.placeholder} className="min-h-24 bg-background/40" /> : <Input id={field.name} name={field.name} required={field.required} placeholder={field.placeholder} className="bg-background/40" />}</div>)}
          <Button type="submit"><Plus />{learning ? "Save learning review" : "Save case locally"}</Button>
          <p role="status" className="text-sm text-primary">{status}</p>
          {journal.error && <p role="alert" className="text-sm text-destructive">{journal.error}</p>}
        </form>
        <div className="space-y-4">
          {count === 0 && <div className="border-t py-8 text-muted-foreground">{learning ? <History className="mb-3 size-6" /> : <BookOpen className="mb-3 size-6" />}<p>{learning ? "No learning reviews yet." : "No saved cases yet."}</p></div>}
          {learning ? journal.reviews.map((r, i) => <article key={r.id} className="rounded-2xl border bg-card/60 p-5 text-center sm:p-6">
            <RecordHeader number={journal.reviews.length - i} date={r.createdAt} onDelete={() => { if (window.confirm("Delete this learning review?")) journal.deleteReview(r.id); }} />
            <h3 className="mt-5 break-words text-lg font-semibold">{r.initialDiagnosis}</h3>
            {r.caseId && <p className="mt-1 text-xs text-primary">{journal.cases.find((c) => c.id === r.caseId)?.title}</p>}
            <Detail label="Revised diagnosis" value={r.revisedDiagnosis} /><Detail label="Missed clue / error" value={r.error} />
            <Lesson label="Lesson to remember" text={r.lesson} />
          </article>) : journal.cases.map((c, i) => <article key={c.id} className="rounded-2xl border bg-card/60 p-6 text-center">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>CASE #{journal.cases.length - i}</span><span className="flex items-center gap-1"><time dateTime={c.createdAt}>{c.createdAt.slice(0, 19).replace("T", " ")}</time><Button variant="ghost" size="icon" aria-label="Delete record" title="Delete record" onClick={() => { if (window.confirm("Delete this case? Linked learning reviews will be kept.")) journal.deleteCase(c.id); }}><Trash2 className="size-4" /></Button></span></div>
            <h3 className="mt-3 break-words text-lg font-semibold">{c.title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{c.history}</p>
            <dl className="mt-4 text-sm">{[["Diagnosis", c.diagnosis || "Undetermined"], ["Reasoning", c.reasoning || "Not recorded"]].map(([k, v]) => <div key={k} className="grid grid-cols-[1fr_2fr] gap-4 border-t py-4"><dt className="font-medium">{k}</dt><dd className="whitespace-pre-wrap break-words text-muted-foreground">{v}</dd></div>)}</dl>
            {c.lessons && <div className="mt-2 rounded-xl border border-online/30 bg-online/10 p-5"><h4 className="text-sm font-semibold text-online">Key lesson</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm">{c.lessons}</p></div>}
            <Button asChild variant="ghost" className="mt-4 h-auto whitespace-normal text-primary"><Link to="/mentor" search={{ caseId: c.id }}>Discuss with Medical Mentor <ArrowUpRight /></Link></Button>
          </article>)}
        </div>
      </div>
    </main>
  </div>;
}
function RecordHeader({ number, date, onDelete }: { number: number; date: string; onDelete: () => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>REVIEW #{number}</span><div className="flex items-center gap-1"><time dateTime={date}>{date.slice(0, 19).replace("T", " ")}</time><Button variant="ghost" size="icon" aria-label="Delete record" title="Delete record" onClick={onDelete}><Trash2 className="size-4" /></Button></div></div>;
}
function Detail({ label, value }: { label: string; value: string }) { return <dl className="mt-4 grid gap-2 border-t py-4 text-sm sm:grid-cols-[1fr_2fr] sm:gap-4"><dt className="font-medium text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap break-words text-muted-foreground">{value}</dd></dl>; }
function Lesson({ label, text }: { label: string; text: string }) { return <div className="mt-4 rounded-xl border border-online/30 bg-online/10 p-5"><h4 className="text-sm font-semibold text-online">{label}</h4><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{text}</p></div>; }