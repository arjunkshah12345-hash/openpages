"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, GitFork, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const GITHUB = "https://github.com/arjunkshah12345-hash/openpages";
const SC = "https://www.supercompress.dev";

export default function LandingPage() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <SiteHeader />

      <main>
        {/* Hero — one composition: brand, headline, sub, CTAs, visual */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 90% 55% at 50% -15%, rgba(5,102,255,0.10) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(228,228,222,0.7) 0%, transparent 50%)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-2xl text-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.svg"
                alt=""
                width={48}
                height={48}
                className="mx-auto mb-8"
              />
              <p className="font-[family-name:var(--font-display)] text-[clamp(3rem,8vw,5.5rem)] leading-[0.95] tracking-tight text-[var(--ink)]">
                OpenPages
              </p>
              <h1 className="mt-6 text-xl font-medium tracking-tight text-[var(--ink-muted)] md:text-2xl">
                Your workspace, built for humans and agents.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[var(--ink-faint)] md:text-base">
                Persistent Spaces and collaborative pages — with SuperCompress
                so context grows without your token bill.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Button variant="accent" size="lg" asChild>
                  <Link href="/spaces">
                    Start a Space
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href={GITHUB} target="_blank" rel="noreferrer">
                    <GitFork className="h-4 w-4" />
                    View on GitHub
                  </a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-16 max-w-3xl"
            >
              <ProductPreview />
            </motion.div>
          </div>
        </section>

        {/* SuperCompress */}
        <section
          id="supercompress"
          className="border-t border-[var(--border)] bg-[var(--sidebar)] py-24"
        >
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
                SuperCompress inside
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.75rem)] leading-tight tracking-tight">
                Your workspace grows. Your context window doesn’t.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-muted)]">
                Every AI call runs{" "}
                <span className="text-[var(--ink)]">
                  Workspace → Retrieval → SuperCompress → Model
                </span>
                . Evidence stays. Noise goes. Savings show in the inspector.
              </p>
            </div>
            <CompressViz />
            <p className="mt-10 text-center text-sm text-[var(--ink-faint)]">
              Persistent context without persistent token costs.{" "}
              <a
                href={SC}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                supercompress.dev
              </a>
            </p>
          </div>
        </section>

        {/* Features — one job each, no card grid fluff */}
        <section id="features" className="py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="max-w-md font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.5rem)] tracking-tight">
              Built like Linear. Wired for agents.
            </h2>
            <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-3">
              {[
                {
                  title: "Spaces & Pages",
                  body: "Block editor, slash commands, autosave, and version history attributed to user, agent, or MCP.",
                },
                {
                  title: "Workspace agent",
                  body: "Search, cite, create and edit pages. Multi-step agent mode with a live activity timeline.",
                },
                {
                  title: "Model agnostic",
                  body: "OpenAI, Anthropic, Gemini, OpenRouter, Ollama — always after SuperCompress, never instead of it.",
                },
              ].map((f) => (
                <div key={f.title} className="border-t border-[var(--border)] pt-5">
                  <h3 className="text-[15px] font-semibold text-[var(--ink)]">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MCP */}
        <section id="mcp" className="border-t border-[var(--border)] py-24">
          <div className="mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-2 md:items-start">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.85rem,4vw,2.5rem)] tracking-tight">
                Expose a Space over MCP
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-muted)]">
                Cursor, Claude Code, Codex, and any MCP client can search, read,
                and write pages.{" "}
                <code className="text-[13px] text-[var(--ink)]">
                  workspace_context
                </code>{" "}
                returns SuperCompress-compressed evidence — not a raw dump.
              </p>
            </div>
            <pre className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--ink)] p-5 text-[12px] leading-relaxed text-[#d4d4d0]">
{`{
  "mcpServers": {
    "openpages": {
      "command": "node",
      "args": ["mcp/server.mjs"],
      "env": {
        "OPENPAGES_URL": "http://localhost:3000",
        "OPENPAGES_SPACE_ID": "space_demo"
      }
    }
  }
}`}
            </pre>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--ink)] py-20 text-[var(--paper)]">
          <div className="mx-auto max-w-xl px-6 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.35rem)] tracking-tight">
              Start a Space. Keep the context. Cut the tokens.
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-[var(--paper)] text-[var(--ink)] hover:bg-white"
                asChild
              >
                <Link href="/spaces">Start a Space</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-[var(--paper)] hover:bg-white/10"
                asChild
              >
                <a href={GITHUB} target="_blank" rel="noreferrer">
                  Star on GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 text-xs text-[var(--ink-faint)] sm:flex-row">
          <span>OpenPages · MIT · Powered by SuperCompress</span>
          <div className="flex gap-4">
            <a href={GITHUB} className="hover:text-[var(--ink)]">
              GitHub
            </a>
            <a href={SC} className="hover:text-[var(--ink)]">
              SuperCompress
            </a>
            <Link href="/spaces" className="hover:text-[var(--ink)]">
              App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/80 bg-[var(--paper)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span className="font-[family-name:var(--font-display)] text-lg tracking-tight">
            OpenPages
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-[var(--ink-muted)] md:flex">
          <a href="#supercompress" className="hover:text-[var(--ink)]">
            SuperCompress
          </a>
          <a href="#features" className="hover:text-[var(--ink)]">
            Features
          </a>
          <a href="#mcp" className="hover:text-[var(--ink)]">
            MCP
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href={GITHUB} target="_blank" rel="noreferrer">
              <GitFork className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </Button>
          <Button variant="accent" size="sm" asChild>
            <Link href="/spaces">
              Start a Space
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--paper)] shadow-[0_24px_80px_-40px_rgba(20,20,20,0.35)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--sidebar)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs text-[var(--ink-faint)]">
          Product Launch · Agent
        </span>
      </div>
      <div className="grid md:grid-cols-[1fr_260px]">
        <div className="space-y-3 p-5 md:p-6">
          <div className="ml-auto max-w-[85%] rounded-2xl bg-[var(--ink)] px-4 py-3 text-sm text-[var(--paper)]">
            What are we missing for launch?
          </div>
          <div className="max-w-[92%] rounded-2xl bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--ink-muted)]">
            From Launch Notes and Product Roadmap: MCP auth, SuperCompress
            landing animation, launch-day support rotation.
            <div className="mt-3 flex items-center gap-2 border-t border-[var(--border)] pt-2 text-[11px] text-[var(--ink-faint)]">
              <Sparkles className="h-3 w-3 text-[var(--accent)]" />
              38,492 → 11,203 tokens · 70.9% with SuperCompress
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--border)] bg-[var(--sidebar)] p-4 md:border-l md:border-t-0">
          <div className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-faint)]">
            Context inspector
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-[var(--ink-muted)]">
            <li>🗺️ Product Roadmap</li>
            <li>📝 Launch Notes</li>
            <li>💬 Customer Feedback</li>
            <li>⚡ About SuperCompress</li>
          </ul>
          <div className="mt-4 rounded-lg bg-[var(--accent-soft)] p-3">
            <div className="flex justify-between text-xs font-medium text-[var(--accent)]">
              <span>SuperCompress</span>
              <span>70.9%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/70">
              <div className="h-full w-[71%] rounded-full bg-[var(--accent)] animate-bar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompressViz() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto mt-14 grid max-w-2xl gap-5 md:grid-cols-2">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-6">
        <div className="text-[11px] uppercase tracking-wider text-[var(--ink-faint)]">
          Without SuperCompress
        </div>
        <div className="mt-3 font-[family-name:var(--font-display)] text-4xl tabular-nums text-[var(--ink)]">
          84,291
        </div>
        <div className="text-sm text-[var(--ink-muted)]">tokens</div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
          <div className="h-full w-full rounded-full bg-[var(--ink-faint)]" />
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--accent)]/25 bg-[var(--paper)] p-6">
        <div className="text-[11px] uppercase tracking-wider text-[var(--accent)]">
          With SuperCompress
        </div>
        <div className="mt-3 font-[family-name:var(--font-display)] text-4xl tabular-nums text-[var(--accent)]">
          21,336
        </div>
        <div className="text-sm text-[var(--ink-muted)]">tokens</div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[var(--accent-soft)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-1000 ease-out"
            style={{ width: on ? "25.3%" : "100%" }}
          />
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--accent)]">
          74.7% fewer tokens · same evidence
        </p>
      </div>
    </div>
  );
}
