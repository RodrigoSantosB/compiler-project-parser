module Expr (Expr(..)) where

-- Expressões aritméticas: inteiros, variáveis, funções, operações
data Expr = Con Int
          | Var String
          | Fun String [Expr]
          | Expr :+: Expr
          | Expr :-: Expr
          | Expr :*: Expr
          | Expr :/: Expr
          deriving Show


