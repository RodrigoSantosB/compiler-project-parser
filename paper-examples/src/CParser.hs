module CParser (someFunc) where

import Symbol (Parser, symbol)

-- Parsing 
someFunc :: IO ()
someFunc = putStrLn "someFunc"

test:: Eq s => s -> Parser s s
test toparse = symbol toparse
