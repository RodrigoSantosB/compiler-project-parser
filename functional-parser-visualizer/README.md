# Functional Parser Visualizer

Aplicacao React para demonstrar visualmente parsers funcionais no estilo de Jeroen Fokker.

## Stack

- React + TypeScript
- Tailwind CSS (dark mode)
- React Flow (arvore de parsing)

## Parser modelado

O nucleo implementa:

- `type Parser s r = [s] -> [([s], r)]`
- `(<*>)` como aplicacao de parser
- `(<|>)` como concatenacao de resultados
- `(<@)` como mapeamento de valor

## Rodando

```bash
cd functional-parser-visualizer
npm install
npm run dev
```

## Demo atual

- Gramatica: parenteses aninhados (`parens`)
- Backtracking com efeito "fantasma" nos nos que falham
- Painel lateral com funcao atual (`symbol`, `many`, `chainl`, etc.)
- Lista de sucessos mostrando resultados possiveis e sobra de entrada
