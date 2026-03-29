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
    | Assign Expr Expr               
    | Decl Type Expr (Maybe Expr)    
    | Function String Type [Parameter] Block  
    | Call String [Expr]               
    | BinaryOp Op Expr Expr            
    | If Expr Expr (Maybe Expr)        
    | Return (Maybe Expr)              
    | Block [Expr]                     
    -- Loops
    | For (Maybe Expr) (Maybe Expr) (Maybe Expr) Block  -- init; condition; increment
    | While Expr Block
    | DoWhile Block Expr
    
    -- Switch
    | Switch Expr [(Expr, Block)] (Maybe Block)  -- expression, cases, default
    
    -- Enums
    | EnumDecl String [(String, Maybe Int)]  -- name, values
    
    -- Structs & Unions
    | StructDecl String [(String, Type)]  -- name, fields
    | UnionDecl String [(String, Type)]   -- name, fields
    | StructAccess Expr String            -- struct_var.field
    | StructPtrAccess Expr String         -- struct_ptr->field
    | StructLit String [(String, Expr)]
    deriving Show

data Type 
    = CharType
    | IntType
    | FloatType
    | DoubleType
    | LongType
    | VoidType
    | PtrType Type        
    | ArrayType Type Int   
    deriving Show

data Parameter = Parameter Type String
    deriving Show

data Op = Add | Sub | Mul | Div | Eq | Neq | Lt | Gt
    deriving Show

type Block = [Expr]

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

parseVar :: Parser Expr
parseVar = Var <$> Token.identifier clexer

parseType :: Parser Type
parseType = (IntType <$ Token.reserved clexer "int")
	    <|> (FloatType <$ Token.reserved clexer "float")
	    <|> (DoubleType <$ Token.reserved clexer "double")
	    <|> (LongType <$ Token.reserved clexer "long")
	    <|> (VoidType <$ Token.reserved clexer "void")

-- composite parsers
parseDecl :: Parser Expr
parseDecl = Decl
            <$> parseType                
            <*> parseVar                
            <*> optional (Token.reservedOp clexer "=" *> parseCExpr)  -- init
            <* Token.semi clexer

parseAssign :: Parser Expr
parseAssign = Assign
              <$> parseVar
              <* Token.reservedOp clexer "=" 
	      <*> parseNum
	      <* Token.semi clexer

-- expression parser
parseCExpr :: ParsecT String () Identity Expr
parseCExpr =  parseAssign <|> parseNum <|> parseDecl

-- parse all src code
parseCExprs :: ParsecT String () Identity [Expr]
parseCExprs = Prim.many parseCExpr


-- parser entrypoint
parseSrc :: FilePath -> IO (Either Error.ParseError [Expr])
parseSrc filepath =  readFile filepath >>= \content ->
		    return $ Prim.parse (parseCExprs) "./src/toy.c" content

-- top level caller
parseFile :: IO String
parseFile = do
    result <- parseSrc "./src/toy.c"
    return $ case result of
        Left err -> "Error: " ++ show err
        Right exprs -> 
            if null exprs
                then "No expressions found"
                else show exprs
