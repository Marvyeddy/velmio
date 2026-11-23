import type { ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  BrainCircuit,
  Sparkles,
  Zap,
} from "lucide-react";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  description: string;
};

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen bg-white text-zinc-950 dark:bg-[#09090e] dark:text-white lg:grid-cols-2">
      {/* LEFT: BRAND PANEL */}
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#100c1c] lg:flex lg:flex-col lg:justify-between">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.055)_1px,transparent_1px)] bg-size-[30px_30px]" />

        <div className="pointer-events-none absolute -left-40 top-1/4 size-125 rounded-full bg-violet-700/30 blur-[110px]" />

        <div className="pointer-events-none absolute -right-40 bottom-0 size-137.5 rounded-full bg-fuchsia-700/20 blur-[120px]" />

        {/* Logo */}
        <div className="relative z-10 p-10 xl:p-14">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-500 shadow-[0_0_35px_rgba(139,92,246,.4)]">
              <Sparkles className="size-6 text-white" />
            </div>

            <span className="text-2xl font-bold tracking-[-0.06em] text-white">
              velmio<span className="text-violet-400">.</span>
            </span>
          </Link>
        </div>

        {/* Centerpiece */}
        <div className="relative z-10 px-10 xl:px-14">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-medium text-violet-200">
              <Zap className="size-3.5" />
              Your intelligent workspace
            </div>

            {/* Abstract visual */}
            <div className="relative mb-14 flex h-52 items-center justify-center">
              <div className="absolute size-48 rounded-full border border-violet-400/15" />
              <div className="absolute size-36 rounded-full border border-violet-400/25" />
              <div className="absolute size-24 rounded-full border border-violet-400/40" />

              <motion.div
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute size-48 rounded-full border border-transparent border-t-violet-400/70"
              />

              <div className="absolute size-32 rounded-full bg-violet-500/25 blur-3xl" />

              <div className="relative flex size-20 items-center justify-center rounded-[26px] border border-violet-300/30 bg-violet-500/20 shadow-[0_0_65px_rgba(139,92,246,.35)] backdrop-blur-xl">
                <BrainCircuit className="size-10 text-violet-200" />
              </div>

              <div className="absolute right-[20%] top-5 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-xl">
                <Sparkles className="size-5 text-violet-200" />
              </div>

              <div className="absolute bottom-3 left-[20%] flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 backdrop-blur-xl">
                <Zap className="size-5 text-fuchsia-200" />
              </div>
            </div>

            <h2 className="max-w-xl text-5xl font-semibold leading-[1.1] tracking-[-0.07em] text-white xl:text-6xl">
              Your mind,
              <br />
              <span className="bg-linear-to-r from-violet-300 via-fuchsia-200 to-violet-400 bg-clip-text text-transparent">
                without limits.
              </span>
            </h2>

            <p className="mt-7 max-w-md text-base leading-8 text-zinc-400">
              Think bigger. Create faster. Explore ideas, discover insights, and
              turn curiosity into something extraordinary.
            </p>
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center justify-between p-10 xl:p-14">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Velmio
          </p>

          <span className="flex items-center gap-2 text-xs text-zinc-400">
            Made for curious minds
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </aside>

      {/* RIGHT: FORM PANEL */}
      <section className="relative flex min-h-screen flex-col bg-white px-6 py-8 dark:bg-[#09090e] sm:px-12 lg:px-14 xl:px-20">
        {/* Top navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-300"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Sparkles className="size-5 text-violet-500" />
            <span className="text-lg font-bold tracking-tight">velmio.</span>
          </Link>
        </div>

        {/* Form content */}
        <div className="flex flex-1 items-center justify-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-105"
          >
            <div className="mb-9">
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10">
                <Sparkles className="size-6 text-violet-500 dark:text-violet-300" />
              </div>

              <h1 className="text-3xl font-semibold tracking-[-0.055em] text-zinc-950 dark:text-white sm:text-4xl">
                {title}
              </h1>

              <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            </div>

            {children}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-400 dark:text-zinc-600">
          A little intelligence. Infinite possibilities.
        </div>
      </section>
    </main>
  );
}
