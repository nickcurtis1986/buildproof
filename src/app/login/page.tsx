import type { Metadata } from "next";
import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

function safeNext(n: string | undefined | null) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/feed";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <Logo />
      <h1 className="mt-8 font-display text-3xl font-extrabold tracking-tight">Sign in or create an account</h1>
      <p className="mb-6 mt-2 text-sm text-ink-3">Homeowners and contractors use the same sign-in. You&apos;ll pick which you are next.</p>
      {sp.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">That sign-in link didn&apos;t work or has expired. Please try again.</p>}
      <LoginForm next={safeNext(sp.next)} />
    </main>
  );
}
