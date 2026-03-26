import Prelude hiding ((<*>))
import Symbol (symbol)


-- Tipo de parser: recebe entrada e retorna lista de parseamentos possíveis.
type Parser symbol result = [symbol] -> [([symbol], result)]

-- Transforma uma tupla (cabeça, cauda) em uma lista [cabeça:cauda].
list :: (a, [a]) -> [a]
list (x, xs) = x : xs

-- Parser que sempre tem sucesso sem consumir entrada.
succeed :: r -> Parser s r
succeed v xs = [(xs, v)]

-- Escolha entre dois parsers.
infixl 3 <|>
(<|>) :: Parser s a -> Parser s a -> Parser s a
p <|> q = \xs -> p xs ++ q xs

-- Sequenciamento de parsers.
infixl 4 <*>
(<*>) :: Parser s a -> Parser s b -> Parser s (a, b)
p <*> q = \xs -> [(zs, (v, w)) | (ys, v) <- p xs, (zs, w) <- q ys]

-- Mapeia a saída de um parser por uma função.
infixl 5 <@
(<@) :: Parser s a -> (a -> b) -> Parser s b
p <@ f = \xs -> [(ys, f v) | (ys, v) <- p xs]

-- many: reconhece zero ou mais ocorrências de p.
many :: Parser s a -> Parser s [a]
many p = ((p <*> many p) <@ list)
     <|> succeed []
