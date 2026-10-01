"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Folder,
  GitFork,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import s from "./landing-page.module.css";
import { BrandMark } from "@/components/brand/mark";
import { StartSpaceLink } from "@/components/brand/start-space-link";

const REPO = "https://github.com/arjunkshah12345-hash/openpages";
const examples = {
  research: {
    name: "A new perspective",
    page: "Research notes",
    category: "Research",
    title: "Good questions.\nBetter starting points.",
    intro:
      "A place to follow a thread, connect the dots, and find the idea worth pursuing.",
    heading: "What we're exploring",
    bullets: [
      "Bring the source material together",
      "Find the patterns between ideas",
      "Keep the evidence close",
    ],
    quote: "The best next step starts with a little more context.",
    prompt: "What connects these research notes?",
    answer:
      "Three ideas keep coming up: less friction, more shared context, and a clearer path from research to action.",
    source: "Research notes",
  },
  planning: {
    name: "The next big thing",
    page: "Launch brief",
    category: "Planning",
    title: "A good idea.\nA clear way forward.",
    intro:
      "Turn the messy middle into a plan everyone can build on. One shared starting point.",
    heading: "The path to launch",
    bullets: [
      "Define the story we want to tell",
      "Bring the right people into the Space",
      "Make the first version real",
    ],
    quote: "Make the next step clear. Leave room for what comes next.",
    prompt: "What should we focus on for this launch?",
    answer:
      "Lead with the shared workspace. Show how pages and sources give the agent context, then make SuperCompress the differentiator.",
    source: "Launch brief",
  },
  writing: {
    name: "Words worth sharing",
    page: "First draft",
    category: "Writing",
    title: "Find your words.\nKeep your voice.",
    intro:
      "Start with a thought. Give it some shape. Work with your AI to make it feel like you.",
    heading: "Notes for the first draft",
    bullets: [
      "Start with something worth saying",
      "Make the opening feel human",
      "Edit until every sentence earns its place",
    ],
    quote: "A blank page is an invitation, not a deadline.",
    prompt: "Help me make the opening more direct.",
    answer:
      "Try opening with the idea itself: “Your best work needs room to grow.” It gives the reader a clear starting point while keeping your tone.",
    source: "First draft",
  },
} as const;
type Example = keyof typeof examples;

function ProductPreview() {
  const [active, setActive] = useState<Example>("planning");
  const [answered, setAnswered] = useState(false);
  const [model, setModel] = useState("OpenAI");
  const example = examples[active];
  const choose = (key: Example) => {
    setActive(key);
    setAnswered(false);
  };
  return (
    <div className={s.productSection} id="workspace">
      <div className={s.demoIntro}>
        <span>A space for every kind of thinking.</span>
        <div
          className={s.tabs}
          role="tablist"
          aria-label="Explore workspace examples"
        >
          {(Object.keys(examples) as Example[]).map((key) => (
            <button
              key={key}
              id={`tab-${key}`}
              role="tab"
              aria-controls="workspace-example"
              aria-selected={active === key}
              tabIndex={active === key ? 0 : -1}
              className={active === key ? s.activeTab : ""}
              onClick={() => choose(key)}
              onKeyDown={(event) => {
                const keys = Object.keys(examples) as Example[];
                let index = keys.indexOf(active);
                if (event.key === "ArrowRight")
                  index = (index + 1) % keys.length;
                else if (event.key === "ArrowLeft")
                  index = (index + keys.length - 1) % keys.length;
                else if (event.key === "Home") index = 0;
                else if (event.key === "End") index = keys.length - 1;
                else return;
                event.preventDefault();
                choose(keys[index]);
                document.getElementById(`tab-${keys[index]}`)?.focus();
              }}
            >
              {examples[key].category}
            </button>
          ))}
        </div>
      </div>
      <div className={s.productStage}>
        <div
          className={s.workspace}
          id="workspace-example"
          role="tabpanel"
          aria-labelledby={`tab-${active}`}
        >
          <aside className={s.appSidebar}>
            <div className={s.appBrand}>
              <BrandMark size={19} /> <span>OpenPages</span>
              <ChevronDown size={13} />
            </div>
            <div className={s.appSearch}>
              <Search size={14} />
              <span>Search your Space</span>
              <kbd>⌘ K</kbd>
            </div>
            <div className={s.sidebarLabel}>YOUR SPACE</div>
            <div className={s.spaceName}>
              <span className={s.spaceInitial}>N</span>
              <span>{example.name}</span>
            </div>
            <div className={s.appNavItem}>
              <MessageCircle size={15} /> Workspace agent
            </div>
            <div className={s.appNavItem}>
              <Folder size={15} /> Files & sources
            </div>
            <div className={s.sidebarLabel}>
              PAGES <Plus size={13} />
            </div>
            {(Object.keys(examples) as Example[]).map((key) => (
              <button
                key={key}
                className={`${s.pageNav} ${active === key ? s.pageNavActive : ""}`}
                onClick={() => choose(key)}
              >
                <FileText size={14} />
                {examples[key].page}
              </button>
            ))}
            <div className={s.sidebarBottom}>
              <span className={s.person}>Y</span>
              <span>
                Your workspace<small>Room to think</small>
              </span>
              <ChevronDown size={13} />
            </div>
          </aside>
          <div className={s.documentPane}>
            <div className={s.docToolbar}>
              <span>
                {example.name} <span>/</span> {example.page}
              </span>
              <span className={s.saved}>
                <Check size={12} /> Saved
              </span>
            </div>
            <article className={s.document} key={active}>
              <div className={s.docSymbol}>
                <FileText strokeWidth={1.3} />
              </div>
              <h3>
                {example.title.split("\n").map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h3>
              <p>{example.intro}</p>
              <h4>{example.heading}</h4>
              <ul>
                {example.bullets.map((text, i) => (
                  <li key={text}>
                    <span className={i === 0 ? s.checkDone : s.checkEmpty}>
                      {i === 0 && <Check size={11} />}
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <blockquote>{example.quote}</blockquote>
              <div className={s.docSignature}>
                <span className={s.person}>Y</span> Started by you. Open to
                possibilities.
              </div>
            </article>
          </div>
          <aside className={s.agentPane}>
            <div className={s.agentHeader}>
              <Sparkles size={15} />
              <span>Your Space, understood</span>
            </div>
            <div className={s.agentContent}>
              <div className={s.agentGreeting}>
                <BrandMark />
                <h4>
                  A thought partner.
                  <br />
                  With the full picture.
                </h4>
                <p>
                  Ask a question. Your pages and sources give the conversation
                  somewhere to start.
                </p>
              </div>
              <div className={s.exampleQuestion}>{example.prompt}</div>
              <div className={s.exampleAnswer} aria-live="polite">
                {answered ? (
                  <>
                    <span className={s.answerLabel}>
                      <BrandMark />
                      OpenPages
                    </span>
                    <p>{example.answer}</p>
                    <span className={s.sourcePill}>
                      <FileText size={12} />
                      {example.source}
                      <ArrowUpRight size={11} />
                    </span>
                  </>
                ) : (
                  <button
                    className={s.answerButton}
                    onClick={() => setAnswered(true)}
                  >
                    Explore an example answer <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className={s.agentBottom}>
              <span>
                <span className={s.greenDot} />
                Context from your Space
              </span>
              <label className={s.modelPicker}>
                <span className={s.srOnly}>Example model</span>
                <select
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                >
                  <option>OpenAI</option>
                  <option>Anthropic</option>
                  <option>Gemini</option>
                  <option>Ollama</option>
                </select>
                <ChevronDown size={11} />
              </label>
            </div>
          </aside>
        </div>
        <div className={s.demoCaption}>
          <span>YOUR WORK. YOUR CONTEXT. ONE SPACE.</span>
          <span>
            Interactive product example <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ContextSection() {
  const [focused, setFocused] = useState(false);
  return (
    <section id="context" className={s.contextSection}>
      <div className={s.contextCopy}>
        <span className={s.eyebrow}>POWERED BY SUPERCOMPRESS</span>
        <h2>
          A growing workspace.
          <br />A focused mind.
        </h2>
        <p>
          Good answers need the right context. SuperCompress selects what
          matters to your question, so your model can focus on the work in front
          of you.
        </p>
        <button
          className={s.lightTextLink}
          onClick={() => setFocused((value) => !value)}
          aria-pressed={focused}
        >
          {focused ? "See the whole picture" : "See what stays"}
          <ArrowRight size={18} />
        </button>
      </div>
      <div
        className={`${s.contextGraphic} ${focused ? s.contextFocused : ""}`}
        aria-label={
          focused
            ? "Relevant evidence selected from the workspace"
            : "Pages and sources in the workspace"
        }
      >
        <div className={s.sourceStack}>
          {Array.from({ length: 7 }, (_, i) => (
            <div
              className={s.sourceSheet}
              key={i}
              style={{ "--i": i } as React.CSSProperties}
            >
              <span>
                {
                  [
                    "Launch brief",
                    "Research notes",
                    "Product thinking",
                    "The first draft",
                    "Team decisions",
                    "Source material",
                    "Your next idea",
                  ][i]
                }
              </span>
              <i />
              <i />
              <i className={i % 2 === 0 ? s.evidenceLine : ""} />
              <i />
            </div>
          ))}
        </div>
        <div className={s.focusResult}>
          <span className={s.focusIcon}>
            <Check size={21} />
          </span>
          <span>
            The evidence you need.<small>The rest can wait.</small>
          </span>
        </div>
        <div className={s.contextDiagram}>
          <span>Your Space</span>
          <ArrowRight size={16} />
          <span>SuperCompress</span>
          <ArrowRight size={16} />
          <span>Your model</span>
        </div>
      </div>
    </section>
  );
}

export function LandingPageV2() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [filmPlaying, setFilmPlaying] = useState(false);
  const filmRef = useRef<HTMLVideoElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);
  const playFilm = () => {
    setFilmPlaying(true);
    document.getElementById("film")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "center",
    });
    void filmRef.current?.play().catch(() => {
      /* Native controls remain available. */
    });
  };
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(`git clone ${REPO}.git`);
      setCopied(true);
      setCopyError(false);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyError(true);
    }
  };
  return (
    <div className={s.site}>
      <a className={s.skipLink} href="#main">
        Skip to content
      </a>
      <header className={s.header}>
        <Link className={s.brand} href="/" aria-label="OpenPages home">
          <BrandMark />
          <span>OpenPages</span>
        </Link>
        <nav className={s.topNav} aria-label="Main navigation">
          <a href="#workspace">Product</a>
          <a href="#context">SuperCompress</a>
          <a href="#open-source">
            Open source
            <ArrowUpRight size={12} />
          </a>
        </nav>
        <div className={s.headerActions}>
          <StartSpaceLink className={s.headerStart} iconSize={15}>
            Start a Space
          </StartSpaceLink>
          <button
            className={s.menuButton}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="v2-mobile-menu"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      {menuOpen && (
        <nav
          id="v2-mobile-menu"
          className={s.mobileMenu}
          aria-label="Mobile navigation"
        >
          {[
            ["Product", "#workspace"],
            ["SuperCompress", "#context"],
            ["Open source", "#open-source"],
            ["Start a Space", "/onboarding"],
          ].map(([name, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {name}
              <ArrowUpRight size={18} />
            </a>
          ))}
        </nav>
      )}
      <main id="main" className={s.main}>
        <section className={s.hero}>
          <div className={s.heroEyebrow}>
            <span className={s.greenDot} />
            AN OPEN WORKSPACE FOR HUMAN THINKING
          </div>
          <h1>
            Make room for
            <br />
            your next idea.
          </h1>
          <div className={s.heroBottom}>
            <p>
              The open-source alternative to OpenAI Pages.
              <br className={s.desktopBreak} /> Your notes, knowledge, and AI.
              Together in a space that&apos;s yours.
            </p>
            <div className={s.heroActions}>
              <StartSpaceLink className={s.primary}>
                Start a Space
              </StartSpaceLink>
              <button className={s.watchLink} onClick={playFilm}>
                <span className={s.playSmall}>▶</span>Watch the introduction
                <span className={s.filmTime}>0:32</span>
              </button>
            </div>
          </div>
        </section>
        <ProductPreview />
        <section className={s.manifesto} id="possibilities">
          <div className={s.sectionKicker}>
            <span>01 / A PLACE TO THINK</span>
            <ArrowDown size={17} />
          </div>
          <div className={s.manifestoBody}>
            <h2>
              The best work doesn&apos;t
              <br />
              happen in isolation.
            </h2>
            <p>
              It happens between a note and a conversation. A question and a
              source. An idea and someone who helps you see it differently.
            </p>
            <p>OpenPages brings it all into the same room.</p>
          </div>
        </section>
        <section className={s.featureRows} aria-label="Workspace capabilities">
          <article className={s.featureRow}>
            <div>
              <span className={s.featureNumber}>01</span>
              <h3>
                A home for the
                <br />
                whole idea.
              </h3>
            </div>
            <p>
              Create a Space for a project, a question, or whatever&apos;s
              taking shape. Keep living pages, files, and conversations
              together.
            </p>
            <div className={s.miniPages}>
              <span>
                <FileText size={17} />
                The first thought
              </span>
              <span>
                <FileText size={17} />
                Everything we found
              </span>
              <span>
                <FileText size={17} />
                Where we go next
                <ArrowUpRight size={14} />
              </span>
            </div>
          </article>
          <article className={s.featureRow}>
            <div>
              <span className={s.featureNumber}>02</span>
              <h3>
                Someone to think
                <br />
                it through with.
              </h3>
            </div>
            <p>
              Ask your workspace agent. Get answers grounded in your pages, with
              sources you can follow back to the original thought.
            </p>
            <div className={s.miniAnswer}>
              <span>
                <Sparkles size={16} />
                Make the connection.
              </span>
              <p>Here&apos;s what your notes have in common.</p>
              <small>
                <FileText size={12} />
                Research notes
                <ArrowUpRight size={12} />
              </small>
            </div>
          </article>
          <article className={s.featureRow}>
            <div>
              <span className={s.featureNumber}>03</span>
              <h3>
                A little help.
                <br />
                Still your voice.
              </h3>
            </div>
            <p>
              Write in a full block editor. Invite AI to rewrite, expand, or
              simplify. Review the suggestion and decide what belongs.
            </p>
            <div className={s.miniEdit}>
              <span>Your next great idea starts here.</span>
              <div>
                <span>Rewrite</span>
                <span>Shorten</span>
                <span>Expand</span>
              </div>
              <small>You keep the final say.</small>
            </div>
          </article>
        </section>
        <ContextSection />
        <section className={s.modelSection}>
          <div className={s.sectionKicker}>
            <span>02 / BUILT AROUND YOU</span>
            <ArrowDown size={17} />
          </div>
          <div className={s.modelHeading}>
            <h2>
              Your favorite models.
              <br />
              Your familiar tools.
            </h2>
            <p>
              Bring the intelligence you want to work with. Connect your agents
              through MCP. Your Space travels with the way you think.
            </p>
          </div>
          <div className={s.modelNames} aria-label="Supported model providers">
            <span>OpenAI</span>
            <span>Anthropic</span>
            <span>Gemini</span>
            <span>Ollama</span>
            <span className={s.andMore}>
              And more <ArrowUpRight size={17} />
            </span>
          </div>
          <div className={s.mcpLine}>
            <span className={s.mcpGlyph}>↗↙</span>
            <div>
              <h3>One Space. Connected to your agents.</h3>
              <p>
                Search, read, create, and retrieve focused context through MCP.
              </p>
            </div>
            <a
              href={`${REPO}#mcp`}
              target="_blank"
              rel="noreferrer"
              className={s.textLink}
            >
              Explore MCP
              <ArrowUpRight size={17} />
            </a>
          </div>
        </section>
        <section id="film" className={s.filmSection}>
          <div className={s.filmHeading}>
            <div>
              <span className={s.eyebrow}>MEET OPENPAGES</span>
              <h2>
                A little room.
                <br />A lot of possibility.
              </h2>
            </div>
            <span className={s.filmLength}>THE INTRODUCTION — 00:32</span>
          </div>
          <div className={`${s.filmPlayer} ${filmPlaying ? s.filmActive : ""}`}>
            <video
              ref={filmRef}
              src="/media/openpages-intro.mp4"
              poster="/media/openpages-intro-poster.jpg"
              controls={filmPlaying}
              preload="none"
              playsInline
              aria-label="OpenPages product introduction, 32 seconds. Music and on-screen text; no spoken dialogue."
              onPlay={() => setFilmPlaying(true)}
            />
            {!filmPlaying && (
              <button
                className={s.filmCover}
                onClick={playFilm}
                aria-label="Play the OpenPages introduction"
              >
                <span className={s.playLarge}>▶</span>
                <span>Watch the film</span>
              </button>
            )}
          </div>
        </section>
        <section id="open-source" className={s.openSource}>
          <div className={s.sectionKicker}>
            <span>03 / YOURS, ALL THE WAY DOWN</span>
            <GitFork size={18} />
          </div>
          <div className={s.openGrid}>
            <h2>
              Good ideas
              <br />
              deserve to
              <br />
              be open.
            </h2>
            <div className={s.openCopy}>
              <p>
                Read the code. Run it on your own machine. Make it something we
                haven&apos;t thought of yet.
              </p>
              <p>
                OpenPages is open source under the MIT license. Your workspace,
                your models, your way forward.
              </p>
              <a
                className={s.primary}
                href={REPO}
                target="_blank"
                rel="noreferrer"
              >
                Explore the source
                <ArrowUpRight size={18} />
              </a>
              <div className={s.cloneBox}>
                <code>
                  git clone{" "}
                  {REPO.replace("https://", "").replace(
                    "arjunkshah12345-hash/",
                    "…/",
                  )}
                  .git
                </code>
                <button
                  onClick={copyCommand}
                  aria-label={
                    copied ? "Clone command copied" : "Copy full clone command"
                  }
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <span className={s.copyStatus} role="status">
                {copied
                  ? "Full clone command copied."
                  : copyError
                    ? "Copy unavailable. The full command is in the GitHub README."
                    : "Start locally. Take it anywhere."}
              </span>
            </div>
          </div>
        </section>
        <section className={s.faqSection}>
          <h2>
            A few things
            <br />
            you might wonder.
          </h2>
          <div>
            {[
              {
                q: "What is OpenPages?",
                a: "An open-source workspace for humans and AI agents. Organize your work in Spaces, write living pages, and ask an agent questions grounded in the sources you've brought together.",
              },
              {
                q: "Do I need an API key?",
                a: "You can connect a supported model provider with your own API key, use a local model through Ollama, or connect a compatible ChatGPT account through onboarding. SuperCompress also offers an offline mode.",
              },
              {
                q: "What does SuperCompress do?",
                a: "It compresses retrieved workspace context against your question before that context reaches the model. The context inspector lets you see the sources and the compression, so you can understand what informed an answer.",
              },
              {
                q: "Can I run it myself?",
                a: "Yes. OpenPages is MIT-licensed and designed to self-host, with SQLite by default and Docker Compose included. The repository contains the setup instructions.",
              },
            ].map(({ q, a }) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={s.lastCta}>
          <BrandMark />
          <h2>
            What will you
            <br />
            make room for?
          </h2>
          <StartSpaceLink className={s.primary}>
            Start a Space
          </StartSpaceLink>
        </section>
        <footer className={s.footer}>
          <Link href="/" className={s.footerBrand}>
            <BrandMark />
            OpenPages
          </Link>
          <span>A workspace for humans and agents.</span>
          <div>
            <Link href="/spaces">Spaces</Link>
            <a href={REPO} target="_blank" rel="noreferrer">
              GitHub
              <ArrowUpRight size={12} />
            </a>
            <a href="#main" aria-label="Back to top">
              <ArrowUp size={17} />
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
