# compiler-project-parser

Implementacao de parsers funcionais simples em Haskell, inspirada em exemplos classicos do paper "**Functional Parsers**".

## Ideia central

Todos os exemplos usam a mesma representacao:

$$
	ext{Parser}\;s\;r = [s] \to [([s], r)]
$$

Interpretacao:

- Entrada: uma lista de simbolos `[s]`.
- Saida: uma lista de resultados possiveis `([s], r)`, onde:
	- o primeiro elemento e o restante da entrada (nao consumido);
	- o segundo elemento e o valor reconhecido/produzido.

Em termos praticos:

$$
p\;xs = [] \Rightarrow \text{falha no parse}
$$

$$
p\;xs = [(xs', v)] \Rightarrow \text{sucesso, consumindo parte de } xs
$$

## Como executar

No terminal, dentro de `paper-examples`:

```bash
runghc satisfy.hs
runghc symbol.hs
runghc succeed_and_fail.hs
```

## Funcoes e objetivos

### 1) `satisfy`

Arquivo: `paper-examples/satisfy.hs`

Assinatura:

$$
	ext{satisfy} :: (s \to Bool) \to \text{Parser}\;s\;s
$$

Objetivo:

- Consumir o primeiro simbolo da entrada somente se ele satisfizer um predicado.

Como usar:

- Passe uma condicao (predicado) e depois a entrada.
- Exemplo: `satisfy (== 'a') "abc"`.

Intuicao:

$$
	ext{satisfy}\;p\;(x:xs) =
\begin{cases}
[(xs, x)] & \text{se } p\;x = \text{True} \\
[] & \text{caso contrario}
\end{cases}
$$

### 2) `symbola`

Arquivo: `paper-examples/symbol.hs`

Assinatura:

$$
	ext{symbola} :: \text{Parser}\;Char\;Char
$$

Objetivo:

- Reconhecer especificamente o caractere `'a'` na cabeca da entrada.

Como usar:

- `symbola "abc"` retorna sucesso.
- `symbola "xbc"` retorna falha.

Intuicao:

$$
	ext{symbola}\;(x:xs)=
\begin{cases}
[(xs,'a')] & \text{se } x = 'a' \\
[] & \text{caso contrario}
\end{cases}
$$

### 3) `symbol`

Arquivo: `paper-examples/symbol.hs`

Assinatura:

$$
	ext{symbol} :: Eq\;s \Rightarrow s \to \text{Parser}\;s\;s
$$

Objetivo:

- Generalizar `symbola`: reconhece qualquer simbolo esperado.

Como usar:

- `symbol 'b' "bcd"` retorna `[ ("cd", 'b') ]`.
- `symbol 'a' "bcd"` retorna `[]`.

Intuicao:

$$
	ext{symbol}\;a\;(x:xs)=
\begin{cases}
[(xs,x)] & \text{se } a = x \\
[] & \text{caso contrario}
\end{cases}
$$

### 4) `succeed`

Arquivo: `paper-examples/succeed_and_fail.hs`

Assinatura:

$$
	ext{succeed} :: r \to \text{Parser}\;s\;r
$$

Objetivo:

- Sempre ter sucesso sem consumir entrada.
- Retornar um valor fixo informado pelo usuario.

Como usar:

- `succeed 42 "abc"` retorna `[ ("abc", 42) ]`.

Intuicao:

$$
	ext{succeed}\;v\;xs = [(xs, v)]
$$

### 5) `failP`

Arquivo: `paper-examples/succeed_and_fail.hs`

Assinatura:

$$
	ext{failP} :: \text{Parser}\;s\;r
$$

Objetivo:

- Representar uma falha explicita de parse.

Como usar:

- `failP "abc"` retorna `[]`.
- Ao imprimir no `main`, pode ser necessario anotar tipo, por exemplo:
	`print (failP "abc" :: [(String, Int)])`

Intuicao:

$$
	ext{failP}\;xs = []
$$

## Leitura rapida dos resultados

- `[]`: parser falhou.
- `[(resto, valor)]`: parser teve sucesso, consumiu parte da entrada e produziu `valor`.

Exemplo:

$$
	ext{satisfy}\;(==\,'a')\;"abc" = [("bc", 'a')]
$$

Significa que o parser consumiu `'a'`, sobrou `"bc"`, e retornou `'a'`.
