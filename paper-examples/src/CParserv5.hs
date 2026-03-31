module CParser (parseFile) where

import Prelude (IO, FilePath, String, (>>=), return, print, putStrLn, snd, ($), (>>))
import Prelude (readFile, Eq, Either, Bool(True, False), Show, Int, Maybe(Just,Nothing), (<$>), show, (.), Either (Right,Left), null, (++))
import Data.Functor.Identity(Identity)
import Data.Maybe (catMaybes)
import Control.Applicative ((<*>),(<*),(<$),(*>))

import Text.Parsec.String (Parser, parseFromFile)
import Text.Parsec ((<|>),(<?>),ParsecT)

import qualified Text.Parsec as Parsec
import qualified Text.Parsec.Token as Token
import qualified Text.Parsec.Char as Char
import qualified Text.Parsec.Combinator as Combinator
import qualified Text.Parsec.Error as Error
import qualified Text.Parsec.Prim as Prim
import qualified Text.Parsec.Pos as Pos
import qualified Text.Parsec.Expr as Expr

-- algebraic data types
data TopLevel
    = VarDecl Type String (Maybe Expr)
    | FuncDecl Type String [Parameter] Block
    deriving Show

data Expr 
    = Number String                    
    | Var String                       
    | Assign Expr Expr               
    | Call String [Expr]               
    deriving Show

data Stmt
     = Decl Type String (Maybe Expr)    
     | ExprStmt Expr
     | Return (Maybe Expr)
     | BlockStmt Block
     deriving Show

data Parameter = Parameter Type String
    deriving Show

type Block = [Stmt]

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
	     (parseNum)

parseDecl :: Parser Stmt
parseDecl = Decl
            <$> 
	    (parseType)                
            <*> 
	    (parseIdentifier)                
            <*> 
	    (Combinator.optionMaybe (Token.reservedOp clexer "=" *> parseCExpr))

parseIdentifier :: Parser String
parseIdentifier = Token.identifier clexer

parseParameter :: Parser Parameter
parseParameter = Parameter
		  <$>
		  (parseType)
		  <*>
		  (Token.identifier clexer)

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
parseCExpr = parseAssign 
	     <|> 
	     parseVar 
	     <|>
	     parseCall
	     <|> 
	     parseNum

parseCExprStmt :: Parser Stmt
parseCExprStmt = ExprStmt
		 <$>
		 parseCExpr <* Token.semi clexer 

-- statement parser
parseCStmt :: ParsecT String () Identity Stmt
parseCStmt = Prim.try (parseDecl <* Token.semi clexer)
	     <|>
	     Prim.try parseBlock
	     <|>
	     Prim.try parseCExprStmt 

parseBlock :: Parser Stmt
parseBlock = BlockStmt
	     <$>
	     (Char.char '{' *> Prim.many parseCStmt <* Char.char '}')

parseFunc :: Parser TopLevel
parseFunc = FuncDecl
	    <$>
	    (parseType)
	    <*>
	    (parseIdentifier)
	    <*>
	    (Char.char '(' *> Prim.many parseParameter <* Char.char ')')
	    <*>
	    (parseBlock)

parseTopVar :: Parser TopLevel
parseTopVar = VarDecl
	<$> parseType
	<*> parseIdentifier
	<*> Combinator.optionMaybe (Token.reservedOp clexer "=" *> parseCExpr)

parseTopDecl :: Parser TopLevel
parseTopDecl = (Prim.try parseTopVar <* Token.semi clexer)
		<|> (Prim.try parseFunc <* Token.semi clexer)
		<?> "top-level declaration"

-- parse all src code
parseTopLevel :: ParsecT String () Identity [TopLevel]
parseTopLevel = Prim.many  parseTopDecl

-- parser entrypoint
parseSrc :: FilePath -> IO (Either Error.ParseError [TopLevel])
parseSrc filepath =  readFile filepath >>= \content ->
		    return $ Prim.parse (parseTopLevel) filepath content

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
