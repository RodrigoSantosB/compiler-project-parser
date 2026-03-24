{-# LANGUAGE NoRebindableSyntax #-}
{-# OPTIONS_GHC -fno-warn-missing-import-lists #-}
{-# OPTIONS_GHC -w #-}
module PackageInfo_paper_examples (
    name,
    version,
    synopsis,
    copyright,
    homepage,
  ) where

import Data.Version (Version(..))
import Prelude

name :: String
name = "paper_examples"
version :: Version
version = Version [0,1,0,0] []

synopsis :: String
synopsis = "A mini subset of C in Parsec"
copyright :: String
copyright = ""
homepage :: String
homepage = ""
