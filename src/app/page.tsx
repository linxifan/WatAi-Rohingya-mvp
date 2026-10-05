import { SiteHeader } from "@/components/site-header";
import { TranslateApp } from "@/components/translate-app";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <TranslateApp />
      </main>
      <footer className="border-t border-border/80 px-4 py-5 text-center text-xs leading-relaxed text-muted-foreground sm:px-6">
        A phrasebook is first contact — not a substitute for a qualified Rohingya interpreter,
        especially for health, legal, or protection conversations. Verified sentences come from
        published Rohingyalish materials; dictionary drafts follow documented grammar and are
        labelled as such.
      </footer>
    </div>
  );
}
