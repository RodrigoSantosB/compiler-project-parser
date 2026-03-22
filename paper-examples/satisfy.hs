-- 'symbol' é o tipo da entrada (ex: Char) e 'result' o tipo do retorno (ex: Int)
type Parser symbol result = [symbol] -> [([symbol], result)] 


-- satisfy implementation (Ex 1)
satisfy :: (s -> Bool) -> Parser s s 
satisfy p [] = []
satisfy p (x:xs) = [(xs, x) | p x] 


main :: IO ()
main = do
  putStrLn "Teste satisfy com condição de ser 'a' em \"abc\":"
  print (satisfy (== 'a') "abc")
  putStrLn "Teste satisfy com condição de ser 'a' em \"xbc\":"
  print (satisfy (== 'a') "xbc")
  putStrLn "Teste satisfy com condição de ser um dígito em \"1abc\":"
  print (satisfy (`elem` ['0'..'9']) "1abc")
  putStrLn "Teste satisfy com condição de ser um dígito em \"abc\":"
  print (satisfy (`elem` ['0'..'9']) "abc")