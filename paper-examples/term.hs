import Prelude hiding ((<*>))

-- Exemplo autocontido para parser de expressões aritméticas.

data Expr
  = Con Int
  | Expr :+: Expr
  | Expr :-: Expr
  | Expr :*: Expr
  | Expr :/: Expr
  deriving Show

type Parser s a = [s] -> [([s], a)]

infixl 3 <|>
(<|>) :: Parser s a -> Parser s a -> Parser s a
p <|> q = \xs -> p xs ++ q xs

infixl 4 <*>
(<*>) :: Parser s a -> Parser s b -> Parser s (a, b)
p <*> q = \xs -> [(zs, (v, w)) | (ys, v) <- p xs, (zs, w) <- q ys]

infixl 5 <@
(<@) :: Parser s a -> (a -> b) -> Parser s b
p <@ f = \xs -> [(ys, f v) | (ys, v) <- p xs]

succeed :: r -> Parser s r
succeed v xs = [(xs, v)]

symbol :: Eq s => s -> Parser s s
symbol _ [] = []
symbol a (x:xs)
  | a == x = [(xs, x)]
  | otherwise = []

digit :: Parser Char Char
digit [] = []
digit (x:xs)
  | x >= '0' && x <= '9' = [(xs, x)]
  | otherwise = []

many :: Parser s a -> Parser s [a]
many p = (p <*> many p) <@ (\(x, xs) -> x : xs)
     <|> succeed []

some :: Parser s a -> Parser s [a]
some p = (p <*> many p) <@ (\(x, xs) -> x : xs)

integer :: Parser Char Int
integer = some digit <@ read

parens :: Parser Char a -> Parser Char a
parens p = (symbol '(' <*> p <*> symbol ')') <@ (\((_, v), _) -> v)

-- Fator: inteiro ou expressão entre parênteses.
fact :: Parser Char Expr
fact = integer <@ Con
   <|> parens expr

-- chainl para operadores associativos à esquerda.
chainl :: Parser s a -> Parser s (a -> a -> a) -> Parser s a
chainl p op =
  (p <*> many (op <*> p))
    <@ (\(x, fs) -> foldl (\acc (f, y) -> f acc y) x fs)

-- Termos: fatores separados por * ou /.
term :: Parser Char Expr
term = chainl fact
       (  symbol '*' <@ const (:*:)
      <|> symbol '/' <@ const (:/:) )

-- Expressões: termos separados por + ou -.
expr :: Parser Char Expr
expr = chainl term
       (  symbol '+' <@ const (:+:)
      <|> symbol '-' <@ const (:-:) )

main :: IO ()
main = do
  let parser = expr
  putStrLn "Teste expr em \"1+2*3\":"
  print (parser "1+2*3")
  putStrLn "Teste expr em \"1+2/3\":"
  print (parser "1+2/3")
  putStrLn "Teste expr em \"1+2-3\":"
  print (parser "1+2-3")
  putStrLn "Teste expr em \"1+2*3/4\":"
  print (parser "1+2*3/4")
  putStrLn "Teste expr em \"1+2*3/4-5\":"
  print (parser "1+2*3/4-5")
  putStrLn "Teste expr em \"1+2*3/4-5+6\":"
  print (parser "1+2*3/4-5+6")