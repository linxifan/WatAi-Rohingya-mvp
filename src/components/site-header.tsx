import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border/80 bg-[color-mix(in_oklch,var(--primary),white_88%)]">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-5 sm:px-6">
        <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-primary uppercase">
          Built in partnership with the Welcome Centre
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/" className="block">
              <h1 className="font-[family-name:var(--font-display)] text-3xl leading-none text-foreground sm:text-4xl">
                Ruáingga
              </h1>
            </Link>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              English to Rohingya — to better connect Rohingya newcomers with
              the support and services they need.
            </p>
          </div>
          <nav className="flex gap-1 text-sm">
            <Link
              href="/"
              className="rounded-full px-3 py-1.5 font-medium text-foreground hover:bg-background"
            >
              Translate
            </Link>
            <Link
              href="/theory"
              className="rounded-full px-3 py-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
            >
              How it works
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
