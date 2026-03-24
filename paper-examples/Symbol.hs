-- 'symbol' é o tipo da entrada (ex: Char) e 'result' o tipo do retorno (ex: Int)
module Symbol (Parser, symbol) where

type Parser symbol result = [symbol] -> [([symbol], result)] -- [cite: 77]


-- Define a parser that recognizes any symbol
symbol :: Eq s => s -> Parser s s -- [cite: 98, 100]
symbol a [] = [] -- [cite: 101, 107]
symbol a (x:xs) 
  | a == x    = [(xs, x)] -- [cite: 103, 107]
  | otherwise = [] -- [cite: 104, 107]

main :: IO ()
main = do
  putStrLn "Teste symbol 'b' em \"bcd\":"
  print (symbol 'b' "bcd")
