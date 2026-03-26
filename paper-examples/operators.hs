-- Operador de análise de opção (Seção 8)
(<?) :: Parser s [a] -> (b, a -> b) -> Parser s b
p <? (no, yes) = p <@ f
    where f []  = no
          f [x] = yes x

-- Lista separada por vírgulas
commaList :: Parser Char a -> Parser Char [a]
commaList p = listof p (symbol ',')

-- Repetição com separadores (Seção 7)
listof :: Parser s a -> Parser s b -> Parser s [a]
listof p s = p <*> many (s *> p) <@ (\(x, xs) -> x:xs) 
         <|> succeed []

-- Cadeia de operadores (Seção 7)
chainr :: Parser s a -> Parser s (a -> a -> a) -> Parser s a
chainr p s = p <*> many (s <*> p) <@ uncurry (foldl (\acc (op, v) -> op acc v))
-- Nota: O artigo usa uma versão de chainr que lida com a associatividade.