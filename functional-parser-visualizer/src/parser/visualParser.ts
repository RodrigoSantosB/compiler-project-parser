import { Parser, alt, ap, many, mapP, succeed, symbol } from "./core";

export type RoseTree = {
  label: string;
  children: RoseTree[];
};

export type Outcome = {
  remaining: string;
  tree: RoseTree[];
  isComplete: boolean;
};

export type ParserNodeKind = "terminal" | "nonterminal";
export type ParserNodeStatus = "active" | "success" | "failure" | "ghost" | "complete";

export type ParserNodeSnapshot = {
  id: string;
  parentId?: string;
  label: string;
  kind: ParserNodeKind;
  status: ParserNodeStatus;
  remaining: string;
  branch: number;
};

export type ParserEvent =
  | { type: "focus"; fnName: string }
  | { type: "add"; node: ParserNodeSnapshot }
  | { type: "success"; id: string; remaining: string }
  | { type: "failure"; id: string }
  | { type: "ghost"; id: string }
  | { type: "complete"; id: string };

export type DemoRun = {
  events: ParserEvent[];
  outcomes: Outcome[];
};

export type DemoKind = "parens" | "symbol" | "manyA" | "cparserTest" | "parserSomeFunc" | "cparserSomeFunc" | "expr";

export type DemoOption = {
  id: DemoKind;
  label: string;
  description: string;
  defaultInput: string;
  placeholder: string;
};

export const demoOptions: DemoOption[] = [
  {
    id: "parens",
    label: "parens (parenteses aninhados)",
    description: "Gramatica recursiva: parens = many group",
    defaultInput: "((()))",
    placeholder: "Ex: ((()))"
  },
  {
    id: "symbol",
    label: "symbol x",
    description: "Parser terminal generico para qualquer simbolo escolhido",
    defaultInput: "abc",
    placeholder: "Ex: abc"
  },
  {
    id: "manyA",
    label: "many (symbol 'a')",
    description: "Repeticao com backtracking em <|> entre continuar e parar",
    defaultInput: "aaab",
    placeholder: "Ex: aaab"
  },
  {
    id: "cparserTest",
    label: "CParser.test x",
    description: "Funcao test de CParser: test toparse = symbol toparse",
    defaultInput: "abc",
    placeholder: "Ex: abc"
  },
  {
    id: "parserSomeFunc",
    label: "parser.hs :: someFunc",
    description: "Executa someFunc do modulo parser.hs (efeito IO demonstrativo)",
    defaultInput: "",
    placeholder: "Entrada opcional"
  },
  {
    id: "cparserSomeFunc",
    label: "CParser.hs :: someFunc",
    description: "Executa someFunc do modulo CParser.hs (efeito IO demonstrativo)",
    defaultInput: "",
    placeholder: "Entrada opcional"
  },
  {
    id: "expr",
    label: "Expr.hs :: expr",
    description: "Parser de expressoes aritmeticas gerando AST Con/:+:/:-:/:*:/:/:",
    defaultInput: "2+3*4",
    placeholder: "Ex: 2+3*4"
  }
];

export type HaskellSourceRef = {
  file: string;
  functionName: string;
  code: string;
};

export const haskellSourcesByDemo: Record<DemoKind, HaskellSourceRef[]> = {
  parens: [
    {
      file: "paper-examples (functional-parsers base)",
      functionName: "parens",
      code: "parens = many group"
    }
  ],
  symbol: [
    {
      file: "paper-examples/symbol.hs",
      functionName: "symbol",
      code: "symbol a (x:xs) | a == x = [(xs, x)] | otherwise = []"
    }
  ],
  manyA: [
    {
      file: "paper-examples (combinator many)",
      functionName: "many",
      code: "many p = some p <|> succeed []"
    }
  ],
  cparserTest: [
    {
      file: "paper-examples/src/CParser.hs",
      functionName: "test",
      code: "test toparse = symbol toparse"
    }
  ],
  parserSomeFunc: [
    {
      file: "paper-examples/src/parser.hs",
      functionName: "someFunc",
      code: "someFunc = putStrLn \"someFunc\""
    }
  ],
  cparserSomeFunc: [
    {
      file: "paper-examples/src/CParser.hs",
      functionName: "someFunc",
      code: "someFunc = putStrLn \"someFunc\""
    }
  ],
  expr: [
    {
      file: "paper-examples/Expr.hs",
      functionName: "data Expr",
      code: "data Expr = Con Int | Expr :+: Expr | Expr :-: Expr | Expr :*: Expr | Expr :/: Expr"
    },
    {
      file: "paper-examples/term.hs",
      functionName: "expr/term",
      code: "expr = chainr term (+/-) ; term = chainr fact (*//)"
    }
  ]
};

type TraceState = {
  events: ParserEvent[];
  nodeCounter: number;
};

const mkNodeId = (state: TraceState) => {
  state.nodeCounter += 1;
  return `node-${state.nodeCounter}`;
};

const focus = (state: TraceState, fnName: string) => {
  state.events.push({ type: "focus", fnName });
};

const addNode = (
  state: TraceState,
  node: Omit<ParserNodeSnapshot, "id" | "status" | "branch"> & { branch?: number; status?: ParserNodeStatus }
) => {
  const id = mkNodeId(state);
  state.events.push({
    type: "add",
    node: {
      id,
      parentId: node.parentId,
      label: node.label,
      kind: node.kind,
      status: node.status ?? "active",
      remaining: node.remaining,
      branch: node.branch ?? 0
    }
  });
  return id;
};

const toChars = (input: string): string[] => input.split("");
const remainingToString = (chars: string[], index: number): string => chars.slice(index).join("");

const buildParensParser = (): Parser<string, RoseTree[]> => {
  let parensParser: Parser<string, RoseTree[]>;

  const groupParser: Parser<string, RoseTree> = (input) => {
    const mkGroup =
      (_open: string) =>
      (inner: RoseTree[]) =>
      (_close: string): RoseTree => ({
        label: "group",
        children: inner
      });

    return mapP(
      ap(ap(ap(succeed<string, typeof mkGroup>(mkGroup), symbol("(")), parensParser), symbol(")")),
      (v) => v
    )(input);
  };

  parensParser = (input) => many(groupParser)(input);
  return parensParser;
};

const uniqueOutcomes = (outcomes: Outcome[], limit = 8): Outcome[] => {
  const seen = new Set<string>();
  const result: Outcome[] = [];

  for (const item of outcomes) {
    const key = `${item.remaining}|${JSON.stringify(item.tree)}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
    if (result.length >= limit) {
      break;
    }
  }

  return result;
};

const traceManyGroups = (
  chars: string[],
  index: number,
  state: TraceState,
  parentId: string
): { index: number; ok: boolean } => {
  focus(state, "many");
  focus(state, "<|>");

  const choiceNode = addNode(state, {
    parentId,
    label: "<|> (group ou eps)",
    kind: "nonterminal",
    remaining: remainingToString(chars, index)
  });

  const tryGroupNode = addNode(state, {
    parentId: choiceNode,
    label: "group",
    kind: "nonterminal",
    remaining: remainingToString(chars, index)
  });

  const groupResult = traceGroup(chars, index, state, tryGroupNode);

  if (!groupResult.ok) {
    focus(state, "failP");
    const failNode = addNode(state, {
      parentId: choiceNode,
      label: "fail []",
      kind: "nonterminal",
      remaining: remainingToString(chars, index)
    });
    state.events.push({ type: "failure", id: tryGroupNode });
    state.events.push({ type: "ghost", id: tryGroupNode });
    state.events.push({ type: "failure", id: failNode });
    state.events.push({ type: "ghost", id: failNode });

    const epsNode = addNode(state, {
      parentId: choiceNode,
      label: "succeed []",
      kind: "nonterminal",
      remaining: remainingToString(chars, index)
    });
    state.events.push({ type: "success", id: epsNode, remaining: remainingToString(chars, index) });
    state.events.push({ type: "success", id: choiceNode, remaining: remainingToString(chars, index) });
    return { index, ok: true };
  }

  state.events.push({ type: "success", id: tryGroupNode, remaining: remainingToString(chars, groupResult.index) });
  state.events.push({ type: "success", id: choiceNode, remaining: remainingToString(chars, groupResult.index) });
  return traceManyGroups(chars, groupResult.index, state, parentId);
};

const traceGroup = (
  chars: string[],
  index: number,
  state: TraceState,
  parentId: string
): { index: number; ok: boolean } => {
  focus(state, "group");
  focus(state, "<*>");
  focus(state, "<@");

  const groupNode = addNode(state, {
    parentId,
    label: "group ::= '(' parens ')'",
    kind: "nonterminal",
    remaining: remainingToString(chars, index)
  });

  focus(state, "symbol");
  const openNode = addNode(state, {
    parentId: groupNode,
    label: "symbol '('",
    kind: "terminal",
    remaining: remainingToString(chars, index)
  });

  if (chars[index] !== "(") {
    state.events.push({ type: "failure", id: openNode });
    state.events.push({ type: "failure", id: groupNode });
    return { index, ok: false };
  }

  state.events.push({ type: "success", id: openNode, remaining: remainingToString(chars, index + 1) });

  const innerNode = addNode(state, {
    parentId: groupNode,
    label: "parens",
    kind: "nonterminal",
    remaining: remainingToString(chars, index + 1)
  });

  const innerResult = traceManyGroups(chars, index + 1, state, innerNode);
  if (!innerResult.ok) {
    state.events.push({ type: "failure", id: innerNode });
    state.events.push({ type: "failure", id: groupNode });
    return { index, ok: false };
  }
  state.events.push({ type: "success", id: innerNode, remaining: remainingToString(chars, innerResult.index) });

  focus(state, "symbol");
  const closeNode = addNode(state, {
    parentId: groupNode,
    label: "symbol ')'",
    kind: "terminal",
    remaining: remainingToString(chars, innerResult.index)
  });

  if (chars[innerResult.index] !== ")") {
    state.events.push({ type: "failure", id: closeNode });
    state.events.push({ type: "failure", id: groupNode });
    return { index, ok: false };
  }

  state.events.push({ type: "success", id: closeNode, remaining: remainingToString(chars, innerResult.index + 1) });
  state.events.push({ type: "success", id: groupNode, remaining: remainingToString(chars, innerResult.index + 1) });
  return { index: innerResult.index + 1, ok: true };
};

export const codeByFunction: Record<string, string> = {
  symbol: `symbol a (x:xs) = if a == x then [(xs, x)] else []`,
  test: `test toparse = symbol toparse`,
  someFunc: `someFunc = putStrLn "someFunc"`,
  many: `many p = (some p) <|> succeed []`,
  failP: `failP xs = []`,
  chainl: `p \`chainl\` op = p <*> many (op <*> p) <@ foldl apply`,
  "<*>": `pf <*> pa = \\xs -> [ (ys, f a) | (zs, f) <- pf xs, (ys, a) <- pa zs ]`,
  "<|>": `p <|> q = \\xs -> p xs ++ q xs`,
  "<@": `p <@ f = \\xs -> [ (ys, f a) | (ys, a) <- p xs ]`,
  group: `group = symbol '(' <*> parens <*> symbol ')' <@ mkGroup`,
  parens: `parens = many group`,
  expr: `expr = chainr term (symbol '+' <@ const (:+:) <|> symbol '-' <@ const (:-:))`,
  term: `term = chainr fact (symbol '*' <@ const (:*:) <|> symbol '/' <@ const (:/:))`,
  fact: `fact = integer <@ Con <|> parenthesized expr`
};

type ExprAst =
  | { kind: "Con"; value: number }
  | { kind: "Add"; left: ExprAst; right: ExprAst }
  | { kind: "Sub"; left: ExprAst; right: ExprAst }
  | { kind: "Mul"; left: ExprAst; right: ExprAst }
  | { kind: "Div"; left: ExprAst; right: ExprAst };

const exprAstToString = (ast: ExprAst): string => {
  if (ast.kind === "Con") return `Con ${ast.value}`;
  if (ast.kind === "Add") return `(${exprAstToString(ast.left)} :+: ${exprAstToString(ast.right)})`;
  if (ast.kind === "Sub") return `(${exprAstToString(ast.left)} :-: ${exprAstToString(ast.right)})`;
  if (ast.kind === "Mul") return `(${exprAstToString(ast.left)} :*: ${exprAstToString(ast.right)})`;
  return `(${exprAstToString(ast.left)} :/: ${exprAstToString(ast.right)})`;
};

const traceExpectedSymbol = (
  state: TraceState,
  parentId: string,
  chars: string[],
  index: number,
  expected: string
): { ok: boolean; index: number } => {
  focus(state, "symbol");
  const symbolNode = addNode(state, {
    parentId,
    label: `symbol '${expected}'`,
    kind: "terminal",
    remaining: remainingToString(chars, index)
  });
  if (chars[index] === expected) {
    state.events.push({ type: "success", id: symbolNode, remaining: remainingToString(chars, index + 1) });
    return { ok: true, index: index + 1 };
  }
  focus(state, "failP");
  const failNode = addNode(state, {
    parentId,
    label: "fail []",
    kind: "nonterminal",
    remaining: remainingToString(chars, index)
  });
  state.events.push({ type: "failure", id: symbolNode });
  state.events.push({ type: "ghost", id: symbolNode });
  state.events.push({ type: "failure", id: failNode });
  state.events.push({ type: "ghost", id: failNode });
  return { ok: false, index };
};

const traceFactExpr = (
  state: TraceState,
  chars: string[],
  index: number,
  parentId: string
): { ok: boolean; index: number; ast?: ExprAst } => {
  focus(state, "fact");
  const factNode = addNode(state, {
    parentId,
    label: "fact",
    kind: "nonterminal",
    remaining: remainingToString(chars, index)
  });

  if (chars[index] === "(") {
    const open = traceExpectedSymbol(state, factNode, chars, index, "(");
    if (!open.ok) {
      state.events.push({ type: "failure", id: factNode });
      return { ok: false, index };
    }
    const inner = traceExprNode(state, chars, open.index, factNode);
    if (!inner.ok || !inner.ast) {
      state.events.push({ type: "failure", id: factNode });
      return { ok: false, index };
    }
    const close = traceExpectedSymbol(state, factNode, chars, inner.index, ")");
    if (!close.ok) {
      state.events.push({ type: "failure", id: factNode });
      return { ok: false, index };
    }
    state.events.push({ type: "success", id: factNode, remaining: remainingToString(chars, close.index) });
    return { ok: true, index: close.index, ast: inner.ast };
  }

  const numNode = addNode(state, {
    parentId: factNode,
    label: "integer",
    kind: "terminal",
    remaining: remainingToString(chars, index)
  });
  let cursor = index;
  let digits = "";
  while (cursor < chars.length && /[0-9]/.test(chars[cursor])) {
    digits += chars[cursor];
    cursor += 1;
  }
  if (digits.length === 0) {
    focus(state, "failP");
    const failNode = addNode(state, {
      parentId: factNode,
      label: "fail []",
      kind: "nonterminal",
      remaining: remainingToString(chars, index)
    });
    state.events.push({ type: "failure", id: numNode });
    state.events.push({ type: "ghost", id: numNode });
    state.events.push({ type: "failure", id: failNode });
    state.events.push({ type: "ghost", id: failNode });
    state.events.push({ type: "failure", id: factNode });
    return { ok: false, index };
  }

  state.events.push({ type: "success", id: numNode, remaining: remainingToString(chars, cursor) });
  state.events.push({ type: "success", id: factNode, remaining: remainingToString(chars, cursor) });
  return { ok: true, index: cursor, ast: { kind: "Con", value: Number(digits) } };
};

const traceTermNode = (
  state: TraceState,
  chars: string[],
  index: number,
  parentId: string
): { ok: boolean; index: number; ast?: ExprAst } => {
  focus(state, "term");
  const termNode = addNode(state, {
    parentId,
    label: "term",
    kind: "nonterminal",
    remaining: remainingToString(chars, index)
  });

  const first = traceFactExpr(state, chars, index, termNode);
  if (!first.ok || !first.ast) {
    state.events.push({ type: "failure", id: termNode });
    return { ok: false, index };
  }

  let { index: cursor, ast } = first;
  while (cursor < chars.length && (chars[cursor] === "*" || chars[cursor] === "/")) {
    const op = chars[cursor];
    const opResult = traceExpectedSymbol(state, termNode, chars, cursor, op);
    if (!opResult.ok) break;
    const next = traceFactExpr(state, chars, opResult.index, termNode);
    if (!next.ok || !next.ast) break;
    ast = op === "*" ? { kind: "Mul", left: ast, right: next.ast } : { kind: "Div", left: ast, right: next.ast };
    cursor = next.index;
  }

  state.events.push({ type: "success", id: termNode, remaining: remainingToString(chars, cursor) });
  return { ok: true, index: cursor, ast };
};

const traceExprNode = (
  state: TraceState,
  chars: string[],
  index: number,
  parentId: string
): { ok: boolean; index: number; ast?: ExprAst } => {
  focus(state, "expr");
  const exprNode = addNode(state, {
    parentId,
    label: "expr",
    kind: "nonterminal",
    remaining: remainingToString(chars, index)
  });

  const first = traceTermNode(state, chars, index, exprNode);
  if (!first.ok || !first.ast) {
    state.events.push({ type: "failure", id: exprNode });
    return { ok: false, index };
  }

  let { index: cursor, ast } = first;
  while (cursor < chars.length && (chars[cursor] === "+" || chars[cursor] === "-")) {
    const op = chars[cursor];
    const opResult = traceExpectedSymbol(state, exprNode, chars, cursor, op);
    if (!opResult.ok) break;
    const next = traceTermNode(state, chars, opResult.index, exprNode);
    if (!next.ok || !next.ast) break;
    ast = op === "+" ? { kind: "Add", left: ast, right: next.ast } : { kind: "Sub", left: ast, right: next.ast };
    cursor = next.index;
  }

  state.events.push({ type: "success", id: exprNode, remaining: remainingToString(chars, cursor) });
  return { ok: true, index: cursor, ast };
};

const runExprDemo = (rawInput: string): DemoRun => {
  const input = rawInput.replace(/\s+/g, "");
  const chars = toChars(input);
  const state: TraceState = { events: [], nodeCounter: 0 };

  focus(state, "expr");
  const rootId = addNode(state, {
    label: "expr (root)",
    kind: "nonterminal",
    remaining: input
  });

  const parsed = traceExprNode(state, chars, 0, rootId);
  if (!parsed.ok || !parsed.ast) {
    state.events.push({ type: "failure", id: rootId });
    return { events: state.events, outcomes: [] };
  }

  state.events.push({ type: "success", id: rootId, remaining: remainingToString(chars, parsed.index) });
  if (parsed.index === chars.length) {
    state.events.push({ type: "complete", id: rootId });
  }

  return {
    events: state.events,
    outcomes: [
      {
        remaining: remainingToString(chars, parsed.index),
        tree: [{ label: exprAstToString(parsed.ast), children: [] }],
        isComplete: parsed.index === chars.length
      }
    ]
  };
};

export const runParensDemo = (rawInput: string): DemoRun => {
  const input = rawInput.replace(/\s+/g, "");
  const chars = toChars(input);

  const parens = buildParensParser();
  const outcomes = uniqueOutcomes(
    parens(chars).map(([remaining, tree]) => ({
      remaining: remaining.join(""),
      tree,
      isComplete: remaining.length === 0
    }))
  );

  const state: TraceState = { events: [], nodeCounter: 0 };
  focus(state, "parens");

  const rootId = addNode(state, {
    label: "parens (root)",
    kind: "nonterminal",
    remaining: input
  });

  const traced = traceManyGroups(chars, 0, state, rootId);
  if (traced.ok) {
    state.events.push({ type: "success", id: rootId, remaining: remainingToString(chars, traced.index) });
    if (traced.index === chars.length) {
      state.events.push({ type: "complete", id: rootId });
    }
  } else {
    state.events.push({ type: "failure", id: rootId });
  }

  return { events: state.events, outcomes };
};

const runSymbolDemo = (rawInput: string, targetSymbol: string): DemoRun => {
  const input = rawInput;
  const chars = toChars(input);
  const expected = targetSymbol[0] ?? "a";
  const parser = symbol(expected);

  const outcomes = uniqueOutcomes(
    parser(chars).map(([remaining, value]) => ({
      remaining: remaining.join(""),
      tree: [{ label: `symbol '${value}'`, children: [] }],
      isComplete: remaining.length === 0
    }))
  );

  const state: TraceState = { events: [], nodeCounter: 0 };
  focus(state, "symbol");

  const rootId = addNode(state, {
    label: `symbol '${expected}' (root)`,
    kind: "nonterminal",
    remaining: input
  });

  const symbolId = addNode(state, {
    parentId: rootId,
    label: `symbol '${expected}'`,
    kind: "terminal",
    remaining: input
  });

  if (chars[0] === expected) {
    state.events.push({ type: "success", id: symbolId, remaining: remainingToString(chars, 1) });
    state.events.push({ type: "success", id: rootId, remaining: remainingToString(chars, 1) });
    if (chars.length === 1) {
      state.events.push({ type: "complete", id: rootId });
    }
  } else {
    focus(state, "failP");
    const failId = addNode(state, {
      parentId: rootId,
      label: "fail []",
      kind: "nonterminal",
      remaining: input
    });
    state.events.push({ type: "failure", id: failId });
    state.events.push({ type: "ghost", id: failId });
    state.events.push({ type: "failure", id: symbolId });
    state.events.push({ type: "ghost", id: symbolId });
    state.events.push({ type: "failure", id: rootId });
  }

  return { events: state.events, outcomes };
};

const runManyADemo = (rawInput: string): DemoRun => {
  const input = rawInput;
  const chars = toChars(input);
  const parser = many(symbol("a"));

  const outcomes = uniqueOutcomes(
    parser(chars).map(([remaining, values]) => ({
      remaining: remaining.join(""),
      tree: values.map((value) => ({ label: `symbol '${value}'`, children: [] })),
      isComplete: remaining.length === 0
    }))
  );

  const state: TraceState = { events: [], nodeCounter: 0 };
  focus(state, "many");

  const rootId = addNode(state, {
    label: "many (symbol 'a') (root)",
    kind: "nonterminal",
    remaining: input
  });

  let index = 0;
  while (index < chars.length && chars[index] === "a") {
    focus(state, "<|>");
    const choiceId = addNode(state, {
      parentId: rootId,
      label: "<|> (continue ou stop)",
      kind: "nonterminal",
      remaining: remainingToString(chars, index)
    });

    focus(state, "symbol");
    const symbolId = addNode(state, {
      parentId: choiceId,
      label: "symbol 'a'",
      kind: "terminal",
      remaining: remainingToString(chars, index)
    });
    state.events.push({ type: "success", id: symbolId, remaining: remainingToString(chars, index + 1) });
    state.events.push({ type: "success", id: choiceId, remaining: remainingToString(chars, index + 1) });
    index += 1;
  }

  focus(state, "<|>");
  const finalChoice = addNode(state, {
    parentId: rootId,
    label: "<|> (continue ou stop)",
    kind: "nonterminal",
    remaining: remainingToString(chars, index)
  });

  focus(state, "symbol");
  const failNode = addNode(state, {
    parentId: finalChoice,
    label: "symbol 'a'",
    kind: "terminal",
    remaining: remainingToString(chars, index)
  });
  focus(state, "failP");
  const failPNode = addNode(state, {
    parentId: finalChoice,
    label: "fail []",
    kind: "nonterminal",
    remaining: remainingToString(chars, index)
  });
  state.events.push({ type: "failure", id: failNode });
  state.events.push({ type: "ghost", id: failNode });
  state.events.push({ type: "failure", id: failPNode });
  state.events.push({ type: "ghost", id: failPNode });

  const stopNode = addNode(state, {
    parentId: finalChoice,
    label: "succeed []",
    kind: "nonterminal",
    remaining: remainingToString(chars, index)
  });
  state.events.push({ type: "success", id: stopNode, remaining: remainingToString(chars, index) });
  state.events.push({ type: "success", id: finalChoice, remaining: remainingToString(chars, index) });
  state.events.push({ type: "success", id: rootId, remaining: remainingToString(chars, index) });

  if (index === chars.length) {
    state.events.push({ type: "complete", id: rootId });
  }

  return { events: state.events, outcomes };
};

const runCParserTestDemo = (rawInput: string, targetSymbol: string): DemoRun => {
  const input = rawInput;
  const chars = toChars(input);
  const expected = targetSymbol[0] ?? "a";
  const parser = symbol(expected);

  const outcomes = uniqueOutcomes(
    parser(chars).map(([remaining, value]) => ({
      remaining: remaining.join(""),
      tree: [{ label: `test '${value}'`, children: [{ label: `symbol '${value}'`, children: [] }] }],
      isComplete: remaining.length === 0
    }))
  );

  const state: TraceState = { events: [], nodeCounter: 0 };
  focus(state, "test");

  const rootId = addNode(state, {
    label: `test '${expected}' (root)`,
    kind: "nonterminal",
    remaining: input
  });

  focus(state, "symbol");
  const symbolId = addNode(state, {
    parentId: rootId,
    label: `symbol '${expected}'`,
    kind: "terminal",
    remaining: input
  });

  if (chars[0] === expected) {
    state.events.push({ type: "success", id: symbolId, remaining: remainingToString(chars, 1) });
    state.events.push({ type: "success", id: rootId, remaining: remainingToString(chars, 1) });
    if (chars.length === 1) {
      state.events.push({ type: "complete", id: rootId });
    }
  } else {
    focus(state, "failP");
    const failId = addNode(state, {
      parentId: rootId,
      label: "fail []",
      kind: "nonterminal",
      remaining: input
    });
    state.events.push({ type: "failure", id: failId });
    state.events.push({ type: "ghost", id: failId });
    state.events.push({ type: "failure", id: symbolId });
    state.events.push({ type: "ghost", id: symbolId });
    state.events.push({ type: "failure", id: rootId });
  }

  return { events: state.events, outcomes };
};

const runSomeFuncDemo = (label: string, rawInput: string): DemoRun => {
  const input = rawInput;
  const state: TraceState = { events: [], nodeCounter: 0 };
  focus(state, "someFunc");

  const rootId = addNode(state, {
    label: `${label} (root)`,
    kind: "nonterminal",
    remaining: input
  });

  const ioNode = addNode(state, {
    parentId: rootId,
    label: 'putStrLn "someFunc"',
    kind: "nonterminal",
    remaining: input
  });

  state.events.push({ type: "success", id: ioNode, remaining: input });
  state.events.push({ type: "success", id: rootId, remaining: input });
  if (input.length === 0) {
    state.events.push({ type: "complete", id: rootId });
  }

  return {
    events: state.events,
    outcomes: [
      {
        remaining: input,
        tree: [{ label, children: [{ label: 'putStrLn "someFunc"', children: [] }] }],
        isComplete: input.length === 0
      }
    ]
  };
};

export const runDemo = (kind: DemoKind, input: string): DemoRun => {
  if (kind === "symbol") {
    return runSymbolDemo(input, "a");
  }
  if (kind === "manyA") {
    return runManyADemo(input);
  }
  return runParensDemo(input);
};

export const runDemoWithArgs = (kind: DemoKind, input: string, args?: { symbolTarget?: string }): DemoRun => {
  if (kind === "symbol") {
    return runSymbolDemo(input, args?.symbolTarget ?? "a");
  }
  if (kind === "cparserTest") {
    return runCParserTestDemo(input, args?.symbolTarget ?? "a");
  }
  if (kind === "parserSomeFunc") {
    return runSomeFuncDemo("parser.someFunc", input);
  }
  if (kind === "cparserSomeFunc") {
    return runSomeFuncDemo("CParser.someFunc", input);
  }
  if (kind === "expr") {
    return runExprDemo(input);
  }
  return runDemo(kind, input);
};

export const formatRose = (tree: RoseTree[], depth = 0): string => {
  if (tree.length === 0) {
    return `${"  ".repeat(depth)}[]`;
  }
  return tree
    .map((node) => `${"  ".repeat(depth)}${node.label}\n${formatRose(node.children, depth + 1)}`)
    .join("\n");
};
