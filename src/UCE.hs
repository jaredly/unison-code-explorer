module UCE where

import qualified Text.JSON.Generic

import qualified Data.Map.Strict as Map
import qualified UCE.Code
import UCE.Prelude
import qualified Unison.Util.Relation as Relation
import qualified UCE.DeclarationJson

dumpJson :: String -> IO ()
dumpJson projectDirectory = do
  codeinfo <- UCE.Code.load projectDirectory
  let names = codeinfo & UCE.Code.codeDeclarationNames & Relation.domain & Map.toAscList
  let y = map (UCE.DeclarationJson.viewBody codeinfo . fst) names
  let text = Text.JSON.Generic.encodeJSON y
  putStrLn text
