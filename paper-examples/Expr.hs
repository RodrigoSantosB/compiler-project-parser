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

-- Exemplo de uso:
main :: IO ()
main = do
  let e1 = Con 1 :+: Con 2
  let e2 = Var "x" :*: Con 3
  let e3 = Fun "f" [e1, e2]
  
  print e1  -- Output: Con 1 :+: Con 2
  print e2  -- Output: Var "x" :*: Con 3
  print e3  -- Output: Fun "f" [Con 1 :+: Con 2, Var "x" :*: Con 3]


