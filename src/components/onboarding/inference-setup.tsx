"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PROVIDER_CATALOG,
  defaultModelForProvider,
  featuredProviders,
  modelsForProvider,
  moreProviders,
} from "@/lib/models/catalog";
import type { ProviderId } from "@/lib/settings/types";
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  LogIn,
  Sparkles,
} from "lucide-react";

export type InferencePublicSettings = {
  defaultModel: string;
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

type Lane = "chatgpt" | "openai" | "other";

type DeviceState = {
  userCode: string;
  deviceAuthId: string;
  verificationUrl: string;
  intervalSeconds: number;
};

type Props = {
  settings: InferencePublicSettings | null;
  onSettings: (s: InferencePublicSettings) => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
  defaultModel: string;
  setDefaultModel: (id: string) => void;
  onContinue: () => void;
  /** Allow finishing without a model (demo replies) */
  onSkip?: () => void;
};

export function InferenceSetup({
  settings,
  onSettings,
  busy,
  setBusy,
  error,
  setError,
  defaultModel,
  setDefaultModel,
  onContinue,
  onSkip,
}: Props) {
  const initialLane = ((): Lane => {
    if (settings?.chatgpt.connected) return "chatgpt";
    if (settings?.providers.find((p) => p.id === "openai")?.configured) return "openai";
    return "chatgpt";
  })();

  const [lane, setLane] = useState<Lane>(initialLane);
  const [otherId, setOtherId] = useState<ProviderId>("anthropic");
  const [showMore, setShowMore] = useState(false);

  // ChatGPT device + consent
  const [consentOpen, setConsentOpen] = useState(false);
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<"idle" | "waiting" | "done">("idle");
  const [copied, setCopied] = useState(false);

  // Keys
  const [openaiKey, setOpenaiKey] = useState("");
  const [providerKey, setProviderKey] = useState("");
  const [providerBase, setProviderBase] = useState("");
  const [customModel, setCustomModel] = useState("");

  const selectedProvider: ProviderId =
    lane === "chatgpt" ? "chatgpt" : lane === "openai" ? "openai" : otherId;

  const catalogEntry = PROVIDER_CATALOG.find((p) => p.id === selectedProvider);
  const models = useMemo(
    () => modelsForProvider(selectedProvider),
    [selectedProvider]
  );

  const chatgptReady = Boolean(settings?.chatgpt.connected || deviceStatus === "done");
  const openaiReady = Boolean(
    openaiKey.trim() ||
      settings?.providers.find((p) => p.id === "openai")?.configured
  );
  const otherReady = Boolean(
    selectedProvider === "ollama" ||
      providerKey.trim() ||
      settings?.providers.find((p) => p.id === selectedProvider)?.configured
  );

  const canContinue =
    (lane === "chatgpt" && chatgptReady) ||
    (lane === "openai" && openaiReady) ||
    (lane === "other" && otherReady);

  // Keep default model in sync when switching lanes
  useEffect(() => {
    const first = defaultModelForProvider(selectedProvider);
    if (!defaultModel.startsWith(`${selectedProvider}/`)) {
      setDefaultModel(first);
    }
  }, [selectedProvider]); // eslint-disable-line react-hooks/exhaustive-deps

  // Device poll
  useEffect(() => {
    if (!device || deviceStatus !== "waiting") return;
    const t = setInterval(() => {
      void (async () => {
        const res = await fetch("/api/settings/chatgpt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "device-poll",
            deviceAuthId: device.deviceAuthId,
            userCode: device.userCode,
          }),
        });
        const data = await res.json();
        if (data.status === "authorized") {
          setDeviceStatus("done");
          onSettings(data.settings);
          setDefaultModel(
            data.settings?.defaultModel?.startsWith("chatgpt/")
              ? data.settings.defaultModel
              : "chatgpt/gpt-5.4-mini"
          );
          setError(null);
        }
      })();
    }, (device.intervalSeconds || 5) * 1000);
    return () => clearInterval(t);
  }, [device, deviceStatus, onSettings, setDefaultModel, setError]);

  const startDeviceAfterConsent = useCallback(async () => {
    setConsentOpen(false);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "device-start" }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Could not start ChatGPT login");
        return;
      }
      setDevice({
        userCode: data.userCode,
        deviceAuthId: data.deviceAuthId,
        verificationUrl: data.verificationUrl,
        intervalSeconds: data.intervalSeconds,
      });
      setDeviceStatus("waiting");
      window.open(data.verificationUrl, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }, [setBusy, setError]);

  async function importCodex() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import" }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Import failed");
        return;
      }
      onSettings(data.settings);
      setDefaultModel("chatgpt/gpt-5.4-mini");
      setDeviceStatus("done");
    } finally {
      setBusy(false);
    }
  }

  async function disconnectChatGpt() {
    setBusy(true);
    try {
      const res = await fetch("/api/settings/chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      const data = await res.json();
      onSettings(data.settings);
      setDevice(null);
      setDeviceStatus("idle");
    } finally {
      setBusy(false);
    }
  }

  async function saveAndContinue() {
    setBusy(true);
    setError(null);
    try {
      if (lane === "chatgpt") {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            defaultModel: defaultModel.startsWith("chatgpt/")
              ? defaultModel
              : "chatgpt/gpt-5.4-mini",
          }),
        });
        onSettings(await res.json());
        onContinue();
        return;
      }

      if (lane === "openai") {
        const body: Record<string, unknown> = {
          defaultModel: defaultModel.startsWith("openai/")
            ? defaultModel
            : "openai/gpt-5.4-mini",
          providers: {},
        };
        if (openaiKey.trim()) {
          (body.providers as Record<string, unknown>).openai = {
            apiKey: openaiKey.trim(),
            enabled: true,
          };
        }
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        onSettings(await res.json());
        setOpenaiKey("");
        onContinue();
        return;
      }

      // other
      const providers: Record<string, unknown> = {};
      if (selectedProvider === "ollama") {
        providers.ollama = {
          baseUrl: providerBase || catalogEntry?.defaultBaseUrl,
          enabled: true,
        };
      } else if (selectedProvider === "custom") {
        providers.custom = {
          apiKey: providerKey || undefined,
          baseUrl: providerBase || undefined,
          enabled: true,
        };
      } else if (providerKey.trim() || catalogEntry?.needsKey === false) {
        providers[selectedProvider] = {
          apiKey: providerKey || undefined,
          baseUrl: providerBase || catalogEntry?.defaultBaseUrl,
          enabled: true,
        };
      }

      let model = defaultModel;
      if (customModel.trim()) {
        model = customModel.includes("/")
          ? customModel.trim()
          : `${selectedProvider}/${customModel.trim()}`;
      } else if (!model.startsWith(`${selectedProvider}/`)) {
        model = defaultModelForProvider(selectedProvider);
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providers, defaultModel: model }),
      });
      onSettings(await res.json());
      setProviderKey("");
      setDefaultModel(model);
      onContinue();
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!device?.userCode) return;
    try {
      await navigator.clipboard.writeText(device.userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl tracking-tight text-[var(--ink)]">
          Bring your own inference
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ink-muted)]">
          Connect a model after SuperCompress. Prefer ChatGPT on your own plan
          (same idea as{" "}
          <a
            href="https://github.com/opencoredev/login-with-chatgpt"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--brand)] underline underline-offset-2"
          >
            Login with ChatGPT
          </a>
          ), or paste an OpenAI / other provider API key.
        </p>
      </div>

      {/* Lane tabs */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(
          [
            {
              id: "chatgpt" as const,
              title: "ChatGPT account",
              sub: "No API key · your plan",
            },
            {
              id: "openai" as const,
              title: "OpenAI API",
              sub: "sk-… platform key",
            },
            {
              id: "other" as const,
              title: "Other providers",
              sub: "Claude, Gemini, Ollama…",
            },
          ] as const
        ).map((t) => {
          const active = lane === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setLane(t.id);
                setError(null);
                if (t.id === "chatgpt") setDefaultModel("chatgpt/gpt-5.4-mini");
                if (t.id === "openai") setDefaultModel("openai/gpt-5.4-mini");
              }}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? "border-[#158568] bg-[#158568]/08 shadow-sm"
                  : "border-[var(--border)] bg-white/60 hover:border-[var(--ink-faint)]"
              }`}
            >
              <div className="text-sm font-medium text-[var(--ink)]">{t.title}</div>
              <div className="mt-0.5 text-[11px] text-[var(--ink-faint)]">{t.sub}</div>
            </button>
          );
        })}
      </div>

      {/* ChatGPT lane */}
      {lane === "chatgpt" && (
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/70 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#158568] text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--ink)]">
                Continue with ChatGPT
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                Device login via OpenAI&apos;s official Codex OAuth client.
                Tokens stay in <code className="text-[10px]">{settings?.settingsPath}</code>{" "}
                on this machine — never sent to a browser cookie store here.
              </p>
            </div>
          </div>

          {chatgptReady ? (
            <div className="space-y-4">
              <p className="flex flex-wrap items-center gap-2 text-sm text-[var(--success)]">
                <Check className="h-4 w-4" />
                ChatGPT connected
                {settings?.chatgpt.accountId
                  ? ` · ${settings.chatgpt.accountId.slice(0, 10)}…`
                  : ""}
                {settings?.chatgpt.source ? ` (${settings.chatgpt.source})` : ""}
              </p>
              <ModelPicker
                models={models}
                value={defaultModel}
                onChange={setDefaultModel}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="accent" disabled={busy} onClick={() => void saveAndContinue()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Continue with this model
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => void disconnectChatGpt()}>
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                variant="accent"
                size="lg"
                className="w-full sm:w-auto"
                disabled={busy}
                onClick={() => setConsentOpen(true)}
              >
                <LogIn className="h-4 w-4" />
                Continue with ChatGPT
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled={busy} onClick={() => void importCodex()}>
                  <KeyRound className="h-4 w-4" />
                  Import from Codex CLI
                </Button>
              </div>

              {device && deviceStatus === "waiting" && (
                <div className="rounded-xl border border-[#158568]/25 bg-[#158568]/06 p-4">
                  <p className="text-sm text-[var(--ink-muted)]">
                    Open{" "}
                    <a
                      className="font-medium text-[#087b60] underline"
                      href={device.verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {device.verificationUrl.replace("https://", "")}
                    </a>{" "}
                    and enter this code:
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <p className="font-mono text-3xl tracking-[0.25em] text-[var(--ink)]">
                      {device.userCode}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => void copyCode()}>
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-xs text-[var(--ink-faint)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Waiting for approval…
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* OpenAI API lane */}
      {lane === "openai" && (
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/70 p-5">
          <p className="text-sm text-[var(--ink-muted)]">
            Use a platform{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--brand)] underline underline-offset-2"
            >
              OpenAI API key
            </a>
            . Separate from ChatGPT Plus — billed to your OpenAI org.
          </p>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--ink-muted)]">
              OPENAI_API_KEY
            </span>
            <Input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              onPaste={(e) => {
                const t = e.clipboardData.getData("text");
                if (!t) return;
                e.preventDefault();
                setOpenaiKey(t.trim());
              }}
              placeholder={
                settings?.providers.find((p) => p.id === "openai")?.configured
                  ? "••••••••  (saved — paste to replace)"
                  : "sk-…"
              }
              autoComplete="off"
            />
          </label>
          {(openaiReady || openaiKey) && (
            <ModelPicker
              models={modelsForProvider("openai")}
              value={defaultModel}
              onChange={setDefaultModel}
            />
          )}
          <Button
            variant="accent"
            disabled={busy || !openaiReady}
            onClick={() => void saveAndContinue()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save OpenAI &amp; continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Other providers */}
      {lane === "other" && (
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/70 p-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {featuredProviders()
              .filter((p) => p.id !== "chatgpt" && p.id !== "openai")
              .concat(showMore ? moreProviders() : [])
              .map((p) => {
                const configured = settings?.providers.find((x) => x.id === p.id)?.configured;
                const active = otherId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setOtherId(p.id);
                      setProviderBase(p.defaultBaseUrl || "");
                      setDefaultModel(defaultModelForProvider(p.id));
                      setError(null);
                    }}
                    className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                      active
                        ? "border-[var(--ink)] bg-[var(--surface)]"
                        : "border-[var(--border)] bg-white/50 hover:border-[var(--ink-faint)]"
                    }`}
                  >
                    <div className="font-medium text-[var(--ink)]">{p.label}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-[var(--ink-faint)]">
                      {configured ? "Connected" : p.blurb}
                    </div>
                  </button>
                );
              })}
          </div>
          {!showMore && (
            <button
              type="button"
              className="text-xs text-[var(--ink-faint)] underline-offset-2 hover:underline"
              onClick={() => setShowMore(true)}
            >
              Show more providers →
            </button>
          )}

          {catalogEntry && (
            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <p className="text-sm text-[var(--ink-muted)]">{catalogEntry.blurb}</p>
              {catalogEntry.needsKey && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--ink-muted)]">
                    {catalogEntry.keyLabel || "API key"}
                  </span>
                  <Input
                    type="password"
                    value={providerKey}
                    onChange={(e) => setProviderKey(e.target.value)}
                    placeholder={
                      settings?.providers.find((p) => p.id === selectedProvider)?.configured
                        ? "••••••••  (saved — paste to replace)"
                        : catalogEntry.keyPlaceholder || "Paste key"
                    }
                    autoComplete="off"
                  />
                </label>
              )}
              {(catalogEntry.openaiCompatible || selectedProvider === "custom") && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--ink-muted)]">
                    Base URL{selectedProvider === "ollama" ? "" : " (optional)"}
                  </span>
                  <Input
                    value={providerBase}
                    onChange={(e) => setProviderBase(e.target.value)}
                    placeholder={catalogEntry.defaultBaseUrl || "https://…/v1"}
                  />
                </label>
              )}
              {selectedProvider === "ollama" && (
                <p className="text-xs text-[var(--ink-faint)]">
                  Make sure Ollama is running (<code>ollama serve</code>).
                </p>
              )}
              {models.length > 0 ? (
                <ModelPicker
                  models={models}
                  value={defaultModel}
                  onChange={setDefaultModel}
                />
              ) : null}
              {(selectedProvider === "custom" || selectedProvider === "openrouter") && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-[var(--ink-muted)]">
                    Custom model id (optional)
                  </span>
                  <Input
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="provider/model or just model-slug"
                  />
                </label>
              )}
              {catalogEntry.docsUrl && (
                <a
                  href={catalogEntry.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[var(--brand)] hover:underline"
                >
                  Provider docs <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button
                variant="accent"
                disabled={busy || !otherReady}
                onClick={() => void saveAndContinue()}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save {catalogEntry.label} &amp; continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {onSkip && (
        <Button variant="ghost" onClick={onSkip}>
          Skip for now (demo replies)
        </Button>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Consent modal — required before OpenAI device page (LWCG pattern) */}
      {consentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="chatgpt-consent-title"
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xl"
          >
            <h2
              id="chatgpt-consent-title"
              className="text-xl font-semibold tracking-tight text-[var(--ink)]"
            >
              Connect your ChatGPT account?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
              OpenPages will open OpenAI&apos;s device login. After you approve,
              this machine stores a session token under{" "}
              <code className="text-[11px]">~/.openpages/settings.json</code> so
              agent and chat calls can use your ChatGPT plan — after SuperCompress.
              No OpenAI platform API key is created.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--ink-muted)]">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#158568]" />
                You bring your own ChatGPT subscription
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#158568]" />
                Tokens stay on this machine (local OSS settings file)
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#158568]" />
                You can disconnect anytime in setup
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                variant="accent"
                disabled={busy}
                onClick={() => void startDeviceAfterConsent()}
              >
                Continue to OpenAI
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => setConsentOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: Array<{ id: string; label: string; badge?: string; note?: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  if (!models.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--ink-muted)]">Default model</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {models.map((m) => {
          const active = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                active
                  ? "border-[#158568] bg-[#158568]/08"
                  : "border-[var(--border)] bg-white/80 hover:border-[var(--ink-faint)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[var(--ink)]">{m.label}</span>
                {m.badge ? (
                  <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-faint)]">
                    {m.badge}
                  </span>
                ) : null}
              </div>
              {m.note ? (
                <p className="mt-0.5 text-[11px] text-[var(--ink-faint)]">{m.note}</p>
              ) : (
                <p className="mt-0.5 font-mono text-[10px] text-[var(--ink-faint)]">{m.id}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
