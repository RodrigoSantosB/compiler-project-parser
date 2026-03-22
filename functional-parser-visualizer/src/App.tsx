import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, Edge, MarkerType, Node, Position } from "reactflow";
import "reactflow/dist/style.css";

import { CodePanel } from "./components/CodePanel";
import {
  DemoKind,
  demoOptions,
  ParserEvent,
  ParserNodeSnapshot,
  codeByFunction,
  formatRose,
  runDemo
} from "./parser/visualParser";

type ViewState = {
  nodes: Record<string, ParserNodeSnapshot>;
  order: string[];
  currentFn: string;
};

const INITIAL_INPUT = "((()))";
const INITIAL_DEMO: DemoKind = "parens";

const initialFnForDemo = (demo: DemoKind): string => {
  if (demo === "symbolA") return "symbol";
  if (demo === "manyA") return "many";
  return "parens";
};

const applyEvents = (events: ParserEvent[], fallbackFn: string): ViewState => {
  const state: ViewState = {
    nodes: {},
    order: [],
    currentFn: fallbackFn
  };

  for (const event of events) {
    if (event.type === "focus") {
      state.currentFn = event.fnName;
      continue;
    }

    if (event.type === "add") {
      state.nodes[event.node.id] = event.node;
      state.order.push(event.node.id);
      continue;
    }

    if (event.type === "success") {
      const node = state.nodes[event.id];
      if (node) {
        node.status = "success";
        node.remaining = event.remaining;
      }
      continue;
    }

    if (event.type === "failure") {
      const node = state.nodes[event.id];
      if (node) {
        node.status = "failure";
      }
      continue;
    }

    if (event.type === "ghost") {
      const node = state.nodes[event.id];
      if (node) {
        node.status = "ghost";
      }
      continue;
    }

    if (event.type === "complete") {
      const node = state.nodes[event.id];
      if (node) {
        node.status = "complete";
      }
    }
  }

  return state;
};

const nodeClass = (node: ParserNodeSnapshot): string => {
  const base =
    "rounded-xl border px-3 py-2 text-xs shadow-lg transition-all duration-300 min-w-[170px] backdrop-blur-sm";

  if (node.status === "ghost") {
    return `${base} border-danger/40 bg-danger/10 text-slate-300 opacity-30`;
  }
  if (node.status === "failure") {
    return `${base} border-danger bg-danger/25 text-danger animate-pulse`;
  }
  if (node.status === "complete") {
    return `${base} border-success bg-success/20 text-emerald-100 shadow-[0_0_25px_rgba(34,197,94,.55)]`;
  }
  if (node.status === "success") {
    return node.kind === "terminal"
      ? `${base} border-terminal bg-cyan-500/15 text-cyan-100`
      : `${base} border-nonterminal bg-amber-500/15 text-amber-100`;
  }

  return node.kind === "terminal"
    ? `${base} border-cyan-300/50 bg-cyan-700/10 text-cyan-50`
    : `${base} border-amber-300/50 bg-amber-700/10 text-amber-50`;
};

const layoutForReactFlow = (view: ViewState): { nodes: Node[]; edges: Edge[] } => {
  const items = view.order
    .map((id) => view.nodes[id])
    .filter((node): node is ParserNodeSnapshot => Boolean(node && node.status !== "ghost"));

  const depthMemo = new Map<string, number>();
  const depthOf = (id: string): number => {
    if (depthMemo.has(id)) return depthMemo.get(id)!;
    const node = view.nodes[id];
    if (!node || !node.parentId) {
      depthMemo.set(id, 0);
      return 0;
    }
    const value = depthOf(node.parentId) + 1;
    depthMemo.set(id, value);
    return value;
  };

  const verticalMap = new Map<string, number>();
  const rfNodes: Node[] = items.map((node) => {
    const depth = depthOf(node.id);
    const key = `${node.branch}-${depth}`;
    const yIndex = verticalMap.get(key) ?? 0;
    verticalMap.set(key, yIndex + 1);

    return {
      id: node.id,
      data: {
        label: (
          <div className={nodeClass(node)}>
            <p className="font-medium">{node.label}</p>
            <p className="mt-1 text-[10px] text-slate-300">
              sobra: <span className="text-violet-200">"{node.remaining}"</span>
            </p>
          </div>
        )
      },
      position: {
        x: 120 + node.branch * 460 + depth * 320,
        y: 48 + yIndex * 132
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    };
  });

  const visibleIds = new Set(rfNodes.map((n) => n.id));
  const rfEdges: Edge[] = items
    .filter((node) => node.parentId && visibleIds.has(node.parentId))
    .map((node) => {
      const stroke =
        node.status === "failure"
          ? "#ef4444"
          : node.status === "complete"
            ? "#22c55e"
            : node.kind === "terminal"
              ? "#22d3ee"
              : "#f8fafc";

      return {
        id: `e-${node.parentId}-${node.id}`,
        source: node.parentId!,
        target: node.id,
        animated: node.status === "active",
        style: {
          stroke,
          strokeWidth: 2.6,
          opacity: 1
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: stroke
        }
      };
    });

  return { nodes: rfNodes, edges: rfEdges };
};

function App() {
  const [selectedDemo, setSelectedDemo] = useState<DemoKind>(INITIAL_DEMO);
  const [input, setInput] = useState(INITIAL_INPUT);
  const [speedMs, setSpeedMs] = useState(500);
  const [step, setStep] = useState(0);

  const activeDemo = useMemo(
    () => demoOptions.find((option) => option.id === selectedDemo) ?? demoOptions[0],
    [selectedDemo]
  );
  const demo = useMemo(() => runDemo(selectedDemo, input), [selectedDemo, input]);

  useEffect(() => {
    setStep(0);
  }, [demo.events.length, input, selectedDemo]);

  useEffect(() => {
    if (step >= demo.events.length) return;
    const timeout = window.setTimeout(() => setStep((prev) => prev + 1), speedMs);
    return () => window.clearTimeout(timeout);
  }, [step, demo.events.length, speedMs]);

  const visibleEvents = useMemo(() => demo.events.slice(0, step), [demo.events, step]);
  const view = useMemo(() => applyEvents(visibleEvents, initialFnForDemo(selectedDemo)), [visibleEvents, selectedDemo]);
  const graph = useMemo(() => layoutForReactFlow(view), [view]);
  const currentCode = codeByFunction[view.currentFn] ?? codeByFunction.parens;

  return (
    <main className="min-h-screen bg-bg text-slate-100">
      <div className="mx-auto max-w-[1700px] p-4 md:p-6">
        <header className="mb-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
          <h1 className="text-2xl font-semibold text-violet-300">Functional Parser Visualizer</h1>
          <p className="mt-1 text-sm text-slate-300">
            Escolha o parser e execute com sua entrada para visualizar combinadores <code>&lt;*&gt;</code>,{" "}
            <code>&lt;|&gt;</code> e <code>&lt;@</code> em tempo real.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-[260px_1fr_220px_180px]">
            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">Funcao / Demo</span>
              <select
                className="rounded-lg border border-slate-600 bg-black/40 px-3 py-2 text-sm outline-none ring-violet-500/50 focus:ring"
                value={selectedDemo}
                onChange={(e) => {
                  const next = e.target.value as DemoKind;
                  const option = demoOptions.find((item) => item.id === next);
                  setSelectedDemo(next);
                  if (option) {
                    setInput(option.defaultInput);
                  }
                }}
              >
                {demoOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">Entrada</span>
              <input
                className="rounded-lg border border-slate-600 bg-black/40 px-3 py-2 text-sm outline-none ring-violet-500/50 focus:ring"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeDemo.placeholder}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-300">Velocidade ({speedMs}ms)</span>
              <input
                type="range"
                min={120}
                max={1400}
                step={20}
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
              />
            </label>

            <button
              className="self-end rounded-lg border border-violet-500 bg-violet-500/20 px-3 py-2 text-sm hover:bg-violet-500/30"
              onClick={() => setStep(0)}
            >
              Reiniciar animacao
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-400">{activeDemo.description}</p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="h-[620px] overflow-hidden rounded-xl border border-slate-700 bg-slate-950/70">
            <ReactFlow fitView nodes={graph.nodes} edges={graph.edges}>
              <Background color="#334155" gap={26} />
              <Controls />
            </ReactFlow>
          </div>

          <CodePanel functionName={view.currentFn} code={currentCode} />
        </section>

        <section className="mt-4 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
          <h2 className="text-lg font-semibold text-violet-200">Lista de Sucessos (Resultados Possiveis)</h2>
          <p className="mt-1 text-sm text-slate-300">
            Cada coluna representa um resultado retornado por <code>Parser s r = [s] -&gt; [([s], r)]</code>.
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {demo.outcomes.map((outcome, idx) => (
              <article
                key={`${outcome.remaining}-${idx}`}
                className={`rounded-lg border p-3 text-xs ${
                  outcome.isComplete
                    ? "border-success/80 bg-success/10 shadow-[0_0_18px_rgba(34,197,94,.2)]"
                    : "border-slate-700 bg-black/30"
                }`}
              >
                <p className="font-semibold text-slate-200">Resultado #{idx + 1}</p>
                <p className="mt-1 text-slate-300">
                  sobra: <span className="text-violet-200">"{outcome.remaining}"</span>
                </p>
                <pre className="mt-2 max-h-44 overflow-auto rounded bg-black/25 p-2 text-[11px] leading-relaxed text-slate-200">
                  {formatRose(outcome.tree)}
                </pre>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
