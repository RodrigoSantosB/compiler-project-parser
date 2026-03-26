import { HaskellSourceRef } from "../parser/visualParser";

type HaskellSourcePanelProps = {
  items: HaskellSourceRef[];
};

export const HaskellSourcePanel = ({ items }: HaskellSourcePanelProps) => {
  return (
    <aside className="h-full rounded-xl border border-slate-700 bg-surface/70 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-400">Origem Haskell</p>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <article key={`${item.file}-${item.functionName}`} className="rounded-lg border border-slate-700 bg-black/30 p-3">
            <p className="text-xs text-slate-400">{item.file}</p>
            <h3 className="mt-1 text-sm font-semibold text-violet-300">{item.functionName}</h3>
            <pre className="mt-2 overflow-auto rounded bg-black/30 p-2 text-xs text-slate-200">
              <code>{item.code}</code>
            </pre>
          </article>
        ))}
      </div>
    </aside>
  );
};
