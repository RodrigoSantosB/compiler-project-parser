# NOTES:  feature list

## Context
- Why does this project exist?
- What problem does it solve?
- Who is it for?

## Commands
- `cmd1` - what it does
- `cmd2` - what it does

## Configs
- `path/to/config` - what it controls

## Quirks
- Things that don't work as expected
- Workarounds
- Gotchas

## TODO
- [ ] 

## Notes

Version 1: Basic Character Parser

    Parse single digits as numbers

    Manual character matching

    No whitespace handling

    Hardcoded input

Version 2: String Input + Recursion

    Parse multi-digit numbers

    Simple recursion for repetition

    Basic error messages from Parsec

    Added support for variables (single letters)

Version 3: Choice Combinator (<|>)

    Parse numbers OR variables

    Multiple expression types

    Basic backtracking (implicit)

    Added addition operator +

Version 4: Repetition Combinators (many, many1)

    Parse sequences of expressions

    Removed left recursion using many

    Added multiplication operator *

    Operator precedence (multiplication before addition)

Version 5: Lexer Integration

    Added LanguageDef for C-like syntax

    Token parsers (identifier, natural)

    Automatic whitespace skipping

    Comment handling (//, /* */)

Version 6: Expression Parser (buildExpressionParser)

    Declarative operator table

    Proper precedence levels (+, -, *, /)

    Associativity handling (left/right)

    Parentheses support

Version 7: Error Handling

    Custom error messages (<?>)

    Position tracking (automatic from Parsec)

    Better error recovery

    Added try for backtracking control

Version 8: AST Construction

    Algebraic data types for all constructs

    Pretty printing for AST

    Evaluation function for expressions

    Added assignment operator =

Version 9: Statement Parsing

    If-then-else statements

    While loops

    Return statements

    Block statements { ... }

Version 10: Complete Program

    Function declarations

    Function definitions with parameters

    Variable declarations (int x;)

    Full C file parsing with error reporting

## Scratch

- Slides should touch these topics

-> Monadic thinking (do vs >>= notation)

    (>>=, >>, return)

-> What is ParsecT

-> imports in haskell

-> Understanding Hoogle

-> parsec structure (LanguagDef -> parsers helpers (Token,String, Prim, Pos, Expr, Error, Combinator, Char)

-> v1 to v10 (incremental parsing building) (1 slide per version)
    - explain combinators as they appear
    - explain design desicions as they appear

-> summary 

probably 15 slides is enough

---
