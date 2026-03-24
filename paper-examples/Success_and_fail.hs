type Parser symbol result = [symbol] -> [([symbol], result)] 

-- Aways succeeds without consuming input, returning a fixed value 'v'
succeed :: r -> Parser s r
succeed v xs = [(xs, v)] 

-- Aways fails, returning an empty list
failP :: Parser s r
failP xs = [] 

main :: IO ()
main = do
  putStrLn "Teste succeed com valor fixo 42 em \"abc\":"
  print (succeed 42 "abc")
  putStrLn "Teste failP em \"abc\":"
  print (failP "abc" :: [(String, Int)])
  
