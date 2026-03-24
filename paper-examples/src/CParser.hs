module CParser (test) where

import Prelude (IO, FilePath, String, (>>=), return, print, putStrLn, snd, ($))

import Symbol (Parser, symbol)

import Prelude (readFile, Eq)

import Text.Parsec

-- First we need to provide src code that's the entry point
-- First we import the primitives
-- Then we parse strings
-- Then we parse Tokens
-- Then we parse expressions in C such as
-- structs, functions, if and else, for loops and comments!
-- Then we finish

-- this reads the src code for our toy c code
-- for the moment we'll hardcode the path
readSrc :: FilePath -> IO String
readSrc _ =  readFile "./src/toy.c"




main :: IO ()
main = do
	contents <- readSrc ""
	let parsed = test 'a' contents
	case parsed of
		[] -> print "nothing to parse"
		(first:_) -> print $ snd first

test:: Eq s => s -> Parser s s
test toparse = symbol toparse


