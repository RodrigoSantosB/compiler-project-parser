module CParser (readSrc) where

import Prelude (IO, FilePath, String, (>>=), return, print, putStrLn, snd, ($))

import Prelude (readFile, Eq, Either, Bool(True, False))

-- type Parser = (Parsec String () Identity), needs to also pass the return type
-- type ParsecT = Stream type(input), user state(optional), monad and then return type
-- the original signature Parser a a :: input output -> [([input],output)] would be
-- ParsecT input () Identity output 
import Text.Parsec.String (Parser, parseFromFile)
import Text.Parsec ((<|>))

import qualified Text.Parsec as Parsec
import qualified Text.Parsec.Token as Token
import qualified Text.Parsec.Char as Char
import qualified Text.Parsec.Combinator as Combinator
import qualified Text.Parsec.Error as Error
import qualified Text.Parsec.Prim as Prim
import qualified Text.Parsec.Pos as Pos
import qualified Text.Parsec.Expr as Expr

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

readSrc :: FilePath -> IO (Either Error.ParseError String)
readSrc _ =  readFile "./src/toy.c" >>= \content ->
		    return $ Prim.parse (Prim.many Char.letter) "./src/toy.c" content

ctokens :: Token.LanguageDef ()
ctokens = Token.LanguageDef {
    Token.commentStart = "/*",
    Token.commentEnd = "*/",
    Token.commentLine = "//",
    Token.nestedComments = False,           
    Token.identStart = Char.letter <|> Char.char '_',
    Token.identLetter = Char.alphaNum <|> Char.char '_',
    Token.opStart = Char.oneOf "+-*/%=&|<>!",
    Token.opLetter = Char.oneOf "+-*/%=&|<>!",
    Token.reservedNames = [
        "auto", "break", "case", "char", "const", "continue", "default",
        "do", "double", "else", "enum", "extern", "float", "for",
        "goto", "if", "int", "long", "register", "return", "short",
        "signed", "sizeof", "static", "struct", "switch", "typedef",
        "union", "unsigned", "void", "volatile", "while"
        ],
    Token.reservedOpNames = [              
        "+", "-", "*", "/", "%", "=", "==", "!=", "<", ">", "<=", ">=",
        "&&", "||", "!", "&", "|", "^", "~", "<<", ">>", "++", "--",
        "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>="
        ],
    Token.caseSensitive = True
    }

clexer = Token.makeTokenParser ctokens

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


