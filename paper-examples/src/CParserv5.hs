module CParser (parseFile) where

import Prelude (IO, FilePath, String, (>>=), return, print, putStrLn, snd, ($), (>>))
import Prelude (readFile, Eq, Either, Bool(True, False), Show, Int, Maybe(Just,Nothing), (<$>), show, (.), Either (Right,Left), null, (++))
import Data.Functor.Identity(Identity)
import Data.Maybe (catMaybes)
import Control.Applicative ((<*>),(<*),(<$),(*>))

import Text.Parsec.String (Parser, parseFromFile)
import Text.Parsec ((<|>),ParsecT)

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
    | Assign Expr Expr               
    | Decl Type Expr (Maybe Expr)    
    | Function Type String [Parameter] Block  
    | Call String [Expr]               
    | Return (Maybe Expr)              
    | Block [Expr]
    deriving Show

data Parameter = Parameter Type String
    deriving Show

type Block = [Expr]

data Type 
    = CharType
    | IntType
    | FloatType
    | DoubleType
    | LongType
    | VoidType
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

parseType :: Parser Type
parseType = Prim.try
		    (Token.reserved clexer "int" >> return IntType)
		    <|> (Token.reserved clexer "float" >> return FloatType) 
		    <|> (Token.reserved clexer "double" >> return DoubleType)
		    <|> (Token.reserved clexer "long" >> return LongType)
		    <|> (Token.reserved clexer "void" >> return VoidType)

parseAssign :: Parser Expr
parseAssign = Assign 
	     <$>
	     (parseVar <* Token.reservedOp clexer "=") 
	     <*>
	     (parseNum <* Token.semi clexer)

parseDecl :: Parser Expr
parseDecl = Decl
            <$> 
	    (parseType)                
            <*> 
	    (parseVar)                
            <*> 
	    (Combinator.optionMaybe (Token.reservedOp clexer "=" *> parseCExpr) <* Token.semi clexer)

parseIdentifier :: Parser String
parseIdentifier = Token.identifier clexer

parseParameter :: Parser Parameter
parseParameter = Parameter
		  <$>
		  (parseType)
		  <*>
		  (Token.identifier clexer)

parseBlock :: Parser Expr
parseBlock = Block
	     <$>
	     (Char.char '{' *> Prim.many parseCExpr <* Char.char '}' )

parseFunc :: Parser Expr
parseFunc = Function
	    <$>
	    (parseType)
	    <*>
	    (parseIdentifier <* Char.char '(')
	    <*>
	    (Prim.many parseParameter <* Char.char ')')
	    <*>
	    (Prim.many parseBlock <* Token.semi clexer)

parseCall :: Parser Expr
parseCall = Call
	    <$>
	    (parseIdentifier)
	    <*>
	    (Char.char '(' *>
	    Prim.many parseCExpr	
	    <* Char.char ')')	
	    <* Combinator.optionMaybe (Token.semi clexer)

-- expression parser
parseCExpr :: ParsecT String () Identity Expr
parseCExpr =
	 Prim.try parseFunc
	     <|>
	     parseCall
	     <|>
	     parseBlock
	     <|>
	     parseAssign 
	     <|> 
	     parseDecl 
	     <|> 
	     parseVar 
	     <|> 
	     parseNum

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
    result <- parseSrc "./src/csources/toy5.c"
    return $ case result of
        Left err -> "Error: " ++ show err
        Right exprs -> 
            if null exprs
                then "No expressions found"
                else show exprs
