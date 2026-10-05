import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TranslateApp } from "@/components/translate-app";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <TranslateApp />
      </main>
      <SiteFooter />
    </div>
  );
}
