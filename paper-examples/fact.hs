fact :: Parser Char Expr
fact =  integer <@ Con
    <|> identifier <*> (option (parenthesized (commaList expr)) 
                        <? (Var, flip Fun)) <@ ap'
    <|> parenthesized expr
    where ap' (f, x) = f x


main :: IO ()
main = do
  let parser = fact
  putStrLn "Teste fact em \"1\":"
  print (parser "1")
  putStrLn "Teste fact em \"x\":"
  print (parser "x")
  putStrLn "Teste fact em \"f(x)\":"
  print (parser "f(x)")
  putStrLn "Teste fact em \"1+2\":"
  print (parser "1+2")