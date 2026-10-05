import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { THEORY } from "@/lib/theory";

export default function TheoryPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-8 sm:px-6">
        <div className="space-y-3">
          <Badge variant="secondary">Technical theory</Badge>
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-tight">
            How would you implement this, technically?
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The smallest product that helps at the Welcome Centre is a trusted English→Rohingya
            phrase lookup. Everything below is the architecture you would grow into — without
            pretending Rohingya has a safe public translation API today.
          </p>
          <Link href="/" className="inline-block text-sm font-medium text-primary hover:underline">
            ← Back to the translator
          </Link>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Why this shape, not a generic translate box</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Staff need to say a few dozen things, clearly, in a waiting room: wait here, this is
              free, I need an interpreter, where does it hurt. Newcomers need to see and hear
              Ruáingga in large type. A vibecoded wrapper around Google Translate would fail both
              people — Rohingya is not in Cloud Translation, and an LLM will invent grammar.
            </p>
            <p>
              So v1 is retrieval over a labelled phrasebank, with voice in, approximate voice out,
              saved lines, and a large-type desk mode. Production is the same product with review
              workflows, recordings, and a human interpreter queue.
            </p>
          </CardContent>
        </Card>

        <section className="space-y-4">
          {THEORY.map((topic) => (
            <article
              key={topic.id}
              id={topic.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                {topic.question}
              </p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl">{topic.title}</h3>
              <p className="mt-3 text-sm leading-relaxed">{topic.why}</p>
              <div className="mt-4 rounded-xl bg-muted/70 p-4">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  In this build
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">{topic.now}</p>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Production implementation
                </p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                  {topic.production.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </article>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Reading Rohingyalish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p>c is “sh” (cúkuria). ç is a flapped r (hoçé). ñ nasalises the vowel (aññí, tuñí).</p>
            <p>Acute accents (á é í ó ú) mark stress, not a different vowel. Doubled letters are long.</p>
            <p>Ask which script someone reads — Hanifi, Fonna, or Latin — before printing.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
