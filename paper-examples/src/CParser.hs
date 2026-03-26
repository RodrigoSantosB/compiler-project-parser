module CParser (parseFile) where

import Prelude (IO, FilePath, String, (>>=), return, print, putStrLn, snd, ($), (>>))
import Prelude (readFile, Eq, Either, Bool(True, False), Show, Int, Maybe(Just,Nothing), (<$>), show, (.), Either (Right,Left), null, (++))
import Data.Functor.Identity(Identity)
import Data.Maybe (catMaybes)

import Text.Parsec.String (Parser, parseFromFile)
import Text.Parsec ((<|>),ParsecT)
import qualified Control.Applicative as Applicative

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

data Expr 
    = Number String                    
    | Var String                       
    | Assign String Expr               
    | Decl String Type (Maybe Expr)    
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
    | VoidType
    | PtrType Type        
    | ArrayType Type Int   
    deriving Show

data Parameter = Parameter Type String
    deriving Show

data Op = Add | Sub | Mul | Div | Eq | Neq | Lt | Gt
    deriving Show

type Block = [Expr]

parseFile :: IO String
parseFile = do
    result <- parseSrc "./src/toy.c"
    return $ case result of
        Left err -> "Error: " ++ show err
        Right exprs -> 
            if null exprs
                then "No expressions found"
                else show exprs

parseSrc :: FilePath -> IO (Either Error.ParseError [Expr])
parseSrc filepath =  readFile filepath >>= \content ->
		    return $ Prim.parse (parseCExprs) "./src/toy.c" content

-- this is the same as Token.naturalOrFloat >>= \read -> return (Number (show read))
parseNum :: ParsecT String () Identity Expr
parseNum =  Number . show <$> Token.naturalOrFloat clexer

parseVar :: Parser Expr
parseVar = Var . show <$> Token.identifier clexer

parseCExpr :: ParsecT String () Identity Expr
parseCExpr = parseNum <|> parseVar

parseCExprs :: ParsecT String () Identity [Expr]
parseCExprs = Prim.many parseCExpr

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


