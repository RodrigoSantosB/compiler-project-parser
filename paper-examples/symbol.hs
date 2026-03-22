-- 'symbol' é o tipo da entrada (ex: Char) e 'result' o tipo do retorno (ex: Int)
type Parser symbol result = [symbol] -> [([symbol], result)] -- [cite: 77]

-- Define a parser that recognizes just a symbol "a"
symbola :: Parser Char Char -- [cite: 83]
symbola [] = [] -- [cite: 84, 86]
symbola (x:xs) 
  | x == 'a'  = [(xs, 'a')] -- [cite: 87, 91]
  | otherwise = [] -- [cite: 89, 91]


-- Define a parser that recognizes any symbol
symbol :: Eq s => s -> Parser s s -- [cite: 98, 100]
symbol a [] = [] -- [cite: 101, 107]
symbol a (x:xs) 
  | a == x    = [(xs, x)] -- [cite: 103, 107]
  | otherwise = [] -- [cite: 104, 107]

main :: IO ()
main = do
  putStrLn "Teste symbola em \"abc\":"
  print (symbola "abc")
  putStrLn "Teste symbola em \"xbc\":"
  print (symbola "xbc")
  putStrLn "Teste symbol 'b' em \"bcd\":"
  print (symbol 'b' "bcd")