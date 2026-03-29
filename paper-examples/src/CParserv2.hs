module CParser (parseFile) where

import Prelude (IO, FilePath, String, (>>=), return, print, putStrLn, snd, ($), (>>))
import Prelude (readFile, Eq, Either, Bool(True, False), Show, Int, Maybe(Just,Nothing), (<$>), show, (.), Either (Right,Left), null, (++))
import Data.Functor.Identity(Identity)
import Data.Maybe (catMaybes)

import Text.Parsec.String (Parser, parseFromFile)
import Text.Parsec ((<|>),ParsecT)
import Control.Applicative ((<*>),(<*),(<$),(*>),optional)

import qualified Text.Parsec as Parsec
import qualified Text.Parsec.Token as Token
import qualified Text.Parsec.Char as Char
import qualified Text.Parsec.Combinator as Combinator
import qualified Text.Parsec.Error as Error
import qualified Text.Parsec.Prim as Prim
import qualified Text.Parsec.Pos as Pos
import qualified Text.Parsec.Expr as Expr

-- algebraic data types
data Expr 
    = Number String                    
    | Var String                       
    deriving Show

-- lexer
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
        "union", "unsigned", "void", "volatile", "while", "int"
        ],
    Token.reservedOpNames = [              
        "+", "-", "*", "/", "%", "=", "==", "!=", "<", ">", "<=", ">=",
        "&&", "||", "!", "&", "|", "^", "~", "<<", ">>", "++", "--",
        "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>="
        ],
    Token.caseSensitive = True
    }

clexer = Token.makeTokenParser ctokens


parseNum :: ParsecT String () Identity Expr
parseNum =  Token.naturalOrFloat clexer >>= \read ->
		case read of
			Left n -> return $ Number (show n)
			Right n -> return $ Number (show n)

-- same as Token.identifier clexer >>= \exp -> Parser Var exp
parseVar :: Parser Expr
parseVar = Prim.parsecMap Var (Token.identifier clexer)

-- expression parser
parseCExpr :: ParsecT String () Identity Expr
parseCExpr = Combinator.choice [parseNum, parseVar]

-- parse all src code
parseCExprs :: ParsecT String () Identity [Expr]
parseCExprs = Prim.many parseCExpr

-- parser entrypoint
parseSrc :: FilePath -> IO (Either Error.ParseError [Expr])
parseSrc filepath =  readFile filepath >>= \content ->
		    return $ Prim.parse (parseCExprs) filepath content

-- top level caller
parseFile :: IO String
parseFile = do
    result <- parseSrc "./src/csources/toy2.c"
    return $ case result of
        Left err -> "Error: " ++ show err
        Right exprs -> 
            if null exprs
                then "No expressions found"
                else show exprs
