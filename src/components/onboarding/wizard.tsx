"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InferenceSetup } from "@/components/onboarding/inference-setup";
import { BrandMark } from "@/components/brand/mark";
import type { ProviderId } from "@/lib/settings/types";
import {
  Check,
  ChevronRight,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";

type PublicSettings = {
  onboardingComplete: boolean;
  defaultModel: string;
  supercompress: {
    configured: boolean;
    apiUrl: string;
    forceLocal: boolean;
    source: string;
  };
  chatgpt: { connected: boolean; source?: string; accountId?: string };
  providers: Array<{
    id: ProviderId;
    configured: boolean;
    hasKey: boolean;
    baseUrl?: string;
    enabled: boolean;
  }>;
  settingsPath: string;
};

const STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "supercompress", title: "SuperCompress" },
  { id: "model", title: "Inference" },
  { id: "done", title: "Ready" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("welcome");
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SuperCompress
  const [scKey, setScKey] = useState("");
  const [scUrl, setScUrl] = useState("");
  const [scAdvanced, setScAdvanced] = useState(false);
  const [scSkipOpen, setScSkipOpen] = useState(false);
  const [scSkipConfirm, setScSkipConfirm] = useState("");
  const [scOk, setScOk] = useState<null | {
    originalTokens?: number;
    keptTokens?: number;
    tokensSavedPct?: number;
  }>(null);

  const [defaultModel, setDefaultModel] = useState("chatgpt/gpt-5.4-mini");

  const load = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = (await res.json()) as PublicSettings;
    setSettings(data);
    setScUrl(data.supercompress.apiUrl);
    if (data.defaultModel) setDefaultModel(data.defaultModel);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  function normalizeScKey(raw: string) {
    return raw.trim().replace(/^Bearer\s+/i, "");
  }

  async function validateSuperCompress(save: boolean) {
    setBusy(true);
    setError(null);
    setScOk(null);
    const key = normalizeScKey(scKey);
    try {
      const res = await fetch("/api/settings/supercompress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: key || undefined,
          apiUrl: scAdvanced ? scUrl || undefined : undefined,
          save,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Validation failed");
        return false;
      }
      setScOk({
        originalTokens: data.originalTokens,
        keptTokens: data.keptTokens,
        tokensSavedPct: data.tokensSavedPct,
      });
      setSettings(data.settings);
      setScKey("");
      setScSkipOpen(false);
      setScSkipConfirm("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function useLocalCompress() {
    if (scSkipConfirm.trim().toLowerCase() !== "offline") {
      setError("Type offline to confirm you want the weaker local stand-in.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supercompress: { forceLocal: true },
        }),
      });
      setSettings(await res.json());
      setScSkipOpen(false);
      setScSkipConfirm("");
      setStep("model");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingComplete: true,
          defaultModel,
        }),
      });
      setSettings(await res.json());
      router.push("/spaces");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--paper)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 0% -10%, rgba(5,102,255,0.12) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(228,228,222,0.55) 0%, transparent 50%)",
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="op-mark inline-flex items-center gap-2 text-[18px] text-[var(--ink)]"
          >
            <BrandMark size={22} />
            OpenPages
          </Link>
          <p className="max-w-[50%] truncate font-mono text-[10px] text-[var(--ink-faint)]">
            {settings?.settingsPath || "~/.openpages/settings.json"}
          </p>
        </div>

        <ol className="mt-10 flex gap-2">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  i < stepIndex
                    ? "bg-[var(--brand)] text-white"
                    : i === stepIndex
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "bg-[var(--surface)] text-[var(--ink-faint)]"
                }`}
              >
                {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`hidden text-xs sm:inline ${
                  i === stepIndex ? "text-[var(--ink)]" : "text-[var(--ink-faint)]"
                }`}
              >
                {s.title}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex-1 rounded-2xl border border-[var(--border)] bg-white/70 p-6 shadow-[0_24px_80px_-60px_rgba(20,20,20,0.35)] backdrop-blur-sm md:p-8">
          {step === "welcome" && (
            <section className="space-y-6">
              <h1 className="text-[clamp(2.25rem,5vw,2.75rem)] font-semibold tracking-[-0.03em] text-[var(--ink)]">
                Set up OpenPages on this machine
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--ink-muted)]">
                First connect{" "}
                <strong className="font-medium text-[var(--ink)]">SuperCompress</strong>
                , then bring your own inference — ChatGPT account, OpenAI API
                key, or any other provider.
              </p>
              <div className="rounded-2xl border border-[var(--border)] bg-white/60 p-5 text-sm text-[var(--ink-muted)] backdrop-blur">
                <p className="font-medium text-[var(--ink)]">Pipeline</p>
                <p className="mt-2 font-mono text-xs text-[var(--brand)]">
                  Workspace → Retrieval → SuperCompress → Model
                </p>
              </div>
              <Button
                variant="accent"
                size="lg"
                onClick={() => setStep("supercompress")}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </section>
          )}

          {step === "supercompress" && (
            <section className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[var(--accent-soft)] p-2.5 text-[var(--brand)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-3xl tracking-tight">Connect SuperCompress</h1>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    Required for OpenPages. Paste your API key — we verify it
                    against the live API before you continue.
                  </p>
                </div>
              </div>

              <ol className="space-y-2 rounded-2xl border border-[var(--border)] bg-white/60 p-4 text-sm text-[var(--ink-muted)]">
                <li className="flex gap-3">
                  <span className="font-mono text-xs text-[var(--brand)]">1</span>
                  <span>
                    Open the{" "}
                    <a
                      href="https://www.supercompress.dev/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[var(--brand)] underline underline-offset-2"
                    >
                      SuperCompress dashboard
                    </a>{" "}
                    and create a free API key.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-xs text-[var(--brand)]">2</span>
                  <span>Copy the key and paste it below. We save it to this machine only.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-xs text-[var(--brand)]">3</span>
                  <span>Hit Connect — OpenPages probes the API so you know it works.</span>
                </li>
              </ol>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--ink-muted)]">
                  SuperCompress API key
                </span>
                <Input
                  type="password"
                  placeholder={
                    settings?.supercompress.configured
                      ? "••••••••  (saved — paste to replace)"
                      : "Paste sc_… key"
                  }
                  value={scKey}
                  onChange={(e) => setScKey(e.target.value)}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (!text) return;
                    e.preventDefault();
                    setScKey(normalizeScKey(text));
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      (scKey || settings?.supercompress.configured)
                    ) {
                      e.preventDefault();
                      void (async () => {
                        const ok = await validateSuperCompress(true);
                        if (ok) setStep("model");
                      })();
                    }
                  }}
                  autoComplete="off"
                  autoFocus
                />
              </label>

              <button
                type="button"
                className="text-xs text-[var(--ink-faint)] underline-offset-2 hover:underline"
                onClick={() => setScAdvanced((v) => !v)}
              >
                {scAdvanced ? "Hide advanced" : "Advanced · custom API URL"}
              </button>
              {scAdvanced && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--ink-muted)]">
                    API URL
                  </span>
                  <Input
                    value={scUrl}
                    onChange={(e) => setScUrl(e.target.value)}
                    placeholder="https://api.supercompress.dev/compress"
                  />
                </label>
              )}

              {scOk && (
                <p className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm text-[var(--brand)]">
                  Connected
                  {scOk.originalTokens != null && scOk.keptTokens != null
                    ? ` · probe ${scOk.originalTokens} → ${scOk.keptTokens} tokens`
                    : ""}
                  {scOk.tokensSavedPct != null
                    ? ` (${Number(scOk.tokensSavedPct).toFixed(0)}% saved)`
                    : ""}
                </p>
              )}

              {settings?.supercompress.configured && !scOk && (
                <p className="text-sm text-[var(--success)]">
                  SuperCompress already configured ({settings.supercompress.source}).
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="accent"
                  size="lg"
                  disabled={
                    busy ||
                    (!normalizeScKey(scKey) && !settings?.supercompress.configured)
                  }
                  onClick={async () => {
                    const ok = await validateSuperCompress(true);
                    if (ok) setStep("model");
                  }}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {settings?.supercompress.configured && !scKey
                    ? "Verify & continue"
                    : "Connect SuperCompress"}
                </Button>
                <a
                  href="https://www.supercompress.dev/dashboard"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" type="button" size="lg">
                    Get a free key
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>

              {settings?.supercompress.configured && !scKey && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setScSkipOpen(false);
                    setStep("model");
                  }}
                >
                  Keep current key →
                </Button>
              )}

              <div className="border-t border-[var(--border)] pt-4">
                {!scSkipOpen ? (
                  <button
                    type="button"
                    className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink-muted)]"
                    onClick={() => {
                      setScSkipOpen(true);
                      setError(null);
                    }}
                  >
                    Can&apos;t get a key right now?
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4">
                    <p className="text-sm text-amber-950">
                      Offline mode uses a{" "}
                      <strong className="font-medium">weaker local stand-in</strong>.
                      Token savings and quality will not match production.
                    </p>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-amber-900/80">
                        Type <span className="font-mono">offline</span> to confirm
                      </span>
                      <Input
                        value={scSkipConfirm}
                        onChange={(e) => setScSkipConfirm(e.target.value)}
                        placeholder="offline"
                        autoComplete="off"
                        className="border-amber-200 bg-white"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={
                          busy ||
                          scSkipConfirm.trim().toLowerCase() !== "offline"
                        }
                        onClick={() => void useLocalCompress()}
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Continue with local stand-in
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setScSkipOpen(false);
                          setScSkipConfirm("");
                          setError(null);
                        }}
                      >
                        Never mind — I&apos;ll get a key
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {step === "model" && (
            <InferenceSetup
              settings={settings}
              onSettings={(s) => setSettings(s as PublicSettings)}
              busy={busy}
              setBusy={setBusy}
              error={error}
              setError={setError}
              defaultModel={defaultModel}
              setDefaultModel={setDefaultModel}
              onContinue={() => {
                setError(null);
                setStep("done");
              }}
              onSkip={() => void finish()}
            />
          )}

          {step === "done" && (
            <section className="space-y-6">
              <h1 className="text-4xl tracking-tight">You&apos;re ready</h1>
              {settings?.supercompress.forceLocal ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  Running on the local SuperCompress stand-in. Add a real API key
                  from setup when you can.
                </p>
              ) : null}
              <ul className="space-y-2 text-sm text-[var(--ink-muted)]">
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                  SuperCompress{" "}
                  {settings?.supercompress.configured
                    ? "connected"
                    : settings?.supercompress.forceLocal
                      ? "local stand-in (degraded)"
                      : "not set (local stand-in)"}
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                  Inference: {defaultModel}
                  {settings?.chatgpt.connected ? " · ChatGPT session" : ""}
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                  Credentials saved to {settings?.settingsPath}
                </li>
              </ul>
              <Button
                variant="accent"
                size="lg"
                disabled={busy}
                onClick={() => void finish()}
              >
                Open Spaces
                <ChevronRight className="h-4 w-4" />
              </Button>
            </section>
          )}

          {error && step !== "model" && (
            <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
