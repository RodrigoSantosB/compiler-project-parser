module CParser (readSrc) where

import Prelude (IO, FilePath, String, (>>=), return, print, putStrLn, snd, ($))

import Prelude (readFile, Eq, Either)

-- type Parser = (Parsec String () Identity), needs to also pass the return type
-- type ParsecT = Stream type(input), user state(optional), monad and then return type
-- the original signature Parser a a :: input output -> [([input],output)] would be
-- ParsecT input () Identity output 
import Text.Parsec.String (Parser, parseFromFile)
import Text.Parsec (ParseError, letter, parse, many)

-- we need to adapt our type to Parsec's one

-- First we need to provide src code that's the entry point
-- First we import the primitives
-- Then we parse strings
-- Then we parse Tokens
-- Then we parse expressions in C such as
-- structs, functions, if and else, for loops and comments!
-- Then we finish

-- this reads the src code for our toy c code
-- for the moment we'll hardcode the path

readSrc :: FilePath -> IO (Either ParseError String)
readSrc _ =  readFile "./src/toy.c" >>= \content ->
		    return $ parse (many letter) "./src/toy.c" content

data GenTokenParser = {

}

readString :: Either ParseError Identifier

-- Now we need to read strings and deal with any problems that might appear



-- main :: IO ()
-- main = do
-- 	contents <- readSrc ""
-- 	let parsed = test 'a' contents
-- 	case parsed of
-- 		[] -> print "nothing to parse"
-- 		(first:_) -> print $ snd first
--
-- test:: Eq s => s -> Parser s s
-- test toparse = symbol toparse


