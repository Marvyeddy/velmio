import { Link } from "react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  ChevronRight,
  FileText,
  Layers3,
  MessageSquareText,
  MoveUpRight,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: BrainCircuit,
    number: "01",
    title: "Intelligence that gets you.",
    description:
      "Conversations that feel natural, with context that carries forward. Less repeating yourself. More getting things done.",
    className: "md:col-span-2",
  },
  {
    icon: FileText,
    number: "02",
    title: "Your knowledge. Unlocked.",
    description:
      "Bring your PDFs, documents, and data into the conversation. Ask better questions. Find answers faster.",
    className: "",
  },
  {
    icon: Zap,
    number: "03",
    title: "Built to take action.",
    description:
      "Go beyond answers with intelligent tools that help you get real work done.",
    className: "",
  },
  {
    icon: Layers3,
    number: "04",
    title: "Everything connects.",
    description:
      "One beautifully simple workspace for ideas, research, and the work that matters.",
    className: "md:col-span-2",
  },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500 text-white shadow-[0_0_24px_rgba(139,92,246,.35)]">
        <WandSparkles className="size-5" />
      </div>
      <span
        className={`text-xl font-bold tracking-[-0.06em] ${
          light ? "text-white" : "text-zinc-950"
        }`}
      >
        velmio<span className="text-violet-400">.</span>
      </span>
    </Link>
  );
}

function Navbar() {
  return (
    <header className="relative z-50 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
      <Logo light />

      <nav className="hidden items-center gap-9 text-sm text-zinc-400 md:flex">
        <a href="#features" className="transition hover:text-white">
          Features
        </a>
        <a href="#how-it-works" className="transition hover:text-white">
          How it works
        </a>
        <a href="#about" className="transition hover:text-white">
          About
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <Link
          to="/signin"
          className="hidden px-4 py-2 text-sm font-medium text-zinc-300 transition hover:text-white sm:block"
        >
          Sign in
        </Link>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-violet-100"
        >
          Get started
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </header>
  );
}

function ChatPreview() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="absolute -inset-5 rounded-[40px] bg-violet-600/20 blur-[90px]" />

      <div className="relative overflow-hidden rounded-[22px] border border-white/15 bg-[#111116] shadow-[0_40px_150px_rgba(0,0,0,.8)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15">
              <Sparkles className="size-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                Velmio Assistant
              </p>
              <p className="text-[10px] text-zinc-500">
                Your intelligent workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-zinc-400">Ready</span>
          </div>
        </div>

        <div className="space-y-7 px-5 py-9 sm:px-12 sm:py-12">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#25212e] px-5 py-3.5 text-sm leading-relaxed text-zinc-200">
              Help me turn my ideas into something extraordinary.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-violet-500">
              <Sparkles className="size-4 text-white" />
            </div>

            <div className="max-w-xl space-y-4">
              <p className="text-sm font-semibold text-white">Velmio</p>
              <p className="text-sm leading-7 text-zinc-300">
                Absolutely. Great ideas deserve thoughtful execution. Let's
                break things down, explore possibilities, and build something
                remarkable together.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    icon: BrainCircuit,
                    label: "Explore possibilities",
                    detail: "Think beyond the obvious",
                  },
                  {
                    icon: Zap,
                    label: "Make it happen",
                    detail: "Turn ideas into action",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-white/[.035] p-4"
                  >
                    <item.icon className="mb-3 size-4 text-violet-400" />
                    <p className="text-xs font-semibold text-white">
                      {item.label}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#1b1b22] p-3 pl-5">
            <span className="flex-1 text-left text-xs text-zinc-500">
              Ask anything, imagine everything...
            </span>
            <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500 text-white">
              <ArrowRight className="size-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-xl border border-white/10 bg-[#1d1b25]/95 px-4 py-3 shadow-xl backdrop-blur-xl sm:flex">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <Check className="size-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white">
            Made for momentum
          </p>
          <p className="text-[10px] text-zinc-500">Think. Create. Achieve.</p>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-28 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-162.5 w-237.5 -translate-x-1/2 rounded-full bg-violet-700/15 blur-[130px]" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,.07)_1px,transparent_1px)] bg-size-[32px_32px] mask-[linear-gradient(to_bottom,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6 text-center lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-medium text-violet-200">
            <Sparkles className="size-3.5" />
            A new way to think, create, and do
            <ChevronRight className="size-3.5" />
          </div>

          <h1 className="mx-auto max-w-5xl text-[clamp(3.5rem,8vw,7.5rem)] font-semibold leading-[1.04] tracking-[-0.075em] text-white">
            Your mind,
            <br />
            <span className="bg-linear-to-r from-[#c5b0ff] via-[#a78bfa] to-[#f0c8ff] bg-clip-text text-transparent">
              without limits.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">
            Meet your AI-powered space for thinking bigger, creating faster, and
            making brilliant things happen. All your curiosity. One intelligent
            companion.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex h-13 items-center gap-3 rounded-full bg-violet-500 px-8 text-sm font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,.3)] transition hover:bg-violet-400"
            >
              Start creating for free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex h-13 items-center gap-2 rounded-full border border-white/15 px-7 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
            >
              See how it works
              <MoveUpRight className="size-4" />
            </a>
          </div>

          <p className="mt-5 text-xs text-zinc-600">
            Your next big idea starts here.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 65, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.9,
            delay: 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-24"
        >
          <ChatPreview />
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="relative border-t border-white/6 py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 max-w-2xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.3em] text-violet-400">
            A different kind of intelligence
          </p>

          <h2 className="text-4xl font-semibold leading-tight tracking-[-0.06em] text-white sm:text-6xl">
            Less busywork.
            <br />
            <span className="text-zinc-500">More breakthroughs.</span>
          </h2>

          <p className="mt-6 max-w-lg text-base leading-8 text-zinc-400">
            Powerful enough for your biggest ambitions. Simple enough to feel
            like second nature.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <motion.div
              key={feature.number}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.25 }}
              className={`group relative min-h-75 overflow-hidden rounded-[26px] border border-white/10 bg-[#141419] p-8 sm:p-10 ${feature.className}`}
            >
              <div className="absolute -right-16 -top-16 size-52 rounded-full bg-violet-500/5 blur-3xl transition group-hover:bg-violet-500/15" />

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-500/10">
                    <feature.icon className="size-5 text-violet-300" />
                  </div>
                  <span className="text-xs text-zinc-600">
                    / {feature.number}
                  </span>
                </div>

                <div className="mt-auto pt-16">
                  <h3 className="text-2xl font-semibold tracking-tight text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-7 text-zinc-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-28">
      <div className="absolute inset-0 bg-linear-to-b from-violet-950/20 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.3em] text-violet-400">
            Beautifully simple
          </p>

          <h2 className="text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">
            From thought to
            <span className="text-violet-400"> extraordinary.</span>
          </h2>

          <p className="mt-6 text-base leading-8 text-zinc-400">
            No complicated setup. No learning curve. Just you, your ideas, and a
            little intelligence.
          </p>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Bring your curiosity",
              description:
                "Start with a question, an idea, or a challenge worth solving.",
              icon: MessageSquareText,
            },
            {
              step: "02",
              title: "Think together",
              description:
                "Explore possibilities with an assistant that helps you connect the dots.",
              icon: BrainCircuit,
            },
            {
              step: "03",
              title: "Make something great",
              description:
                "Turn clarity into progress and progress into meaningful results.",
              icon: Sparkles,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative rounded-3xl border border-white/10 bg-white/2.5 p-9"
            >
              <span className="text-5xl font-light tracking-tighter text-violet-400/30">
                {item.step}
              </span>

              <div className="mt-12 flex size-12 items-center justify-center rounded-2xl bg-violet-500/10">
                <item.icon className="size-5 text-violet-300" />
              </div>

              <h3 className="mt-7 text-xl font-semibold text-white">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="about" className="px-6 py-24 lg:px-10">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-violet-400/20 bg-[#20152f] px-8 py-24 text-center sm:px-16">
        <div className="absolute left-1/2 top-1/2 size-162.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/25 blur-[100px]" />

        <div className="relative">
          <div className="mx-auto mb-8 flex size-16 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/15">
            <Sparkles className="size-8 text-violet-200" />
          </div>

          <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.065em] text-white sm:text-6xl">
            Your next big thing
            <br />
            starts with a thought.
          </h2>

          <p className="mx-auto mt-6 max-w-lg text-base leading-8 text-violet-100/60">
            The future belongs to the curious. Give your ideas the space to
            become something incredible.
          </p>

          <Link
            to="/signup"
            className="mt-10 inline-flex h-13 items-center gap-3 rounded-full bg-white px-8 text-sm font-semibold text-zinc-950 transition hover:bg-violet-100"
          >
            Get started with Velmio
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between lg:px-10">
        <div>
          <Logo light />
          <p className="mt-3 text-xs text-zinc-500">
            A little intelligence. Infinite possibilities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-500">
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-white">
            How it works
          </a>
          <Link to="/signin" className="hover:text-white">
            Sign in
          </Link>
        </div>

        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} Velmio.
        </p>
      </div>
    </footer>
  );
}

export function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#09090e] font-sans text-white antialiased selection:bg-violet-500/30">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
