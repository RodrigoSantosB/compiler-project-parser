type CodePanelProps = {
  functionName: string;
  code: string;
};

export const CodePanel = ({ functionName, code }: CodePanelProps) => {
  return (
    <aside className="h-full rounded-xl border border-slate-700 bg-surface/70 p-4">
      <p className="text-xs uppercase tracking-widest text-slate-400">Funcao atual</p>
      <h2 className="mt-1 text-lg font-semibold text-violet-300">{functionName}</h2>
      <pre className="mt-4 overflow-auto rounded-lg border border-slate-700 bg-black/30 p-3 text-xs leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </aside>
  );
};
