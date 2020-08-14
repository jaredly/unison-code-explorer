module UCE.DeclarationJson where

import Text.JSON.Generic

-- import Concur.Core (Widget)
-- import Concur.Replica (HTML)
-- import qualified Concur.Replica.DOM as H
-- import qualified Concur.Replica.DOM.Events as P
-- import qualified Concur.Replica.DOM.Props as P
import qualified Data.List as List
import qualified Data.Map.Strict as Map
import qualified Data.Set as Set
import UCE.Code
import UCE.Prelude
import qualified Unison.Reference as R
import qualified Unison.Name as Name
import qualified Unison.Util.Relation as Relation
import UCE.Code.Print (Segment(..), toSegments)

data Ref = Ref { primaryName :: Text, alt :: Set Text, rhash :: Text } deriving (Show, Data, Typeable)

data Declaration = Declaration
  { name :: Ref
  , body :: [Segment]
  , dependencies :: [Ref]
  , dependents :: [Ref]
  } deriving (Show, Data, Typeable)

viewBody :: CodeInfo -> Reference -> Declaration
viewBody codeinfo ref =
  Declaration {
    name = (refName ref codeinfo),
    body = case Map.lookup ref (codeBodies codeinfo) of
            Nothing ->
              []
            Just t -> toSegments t,
    dependencies = depList,
    dependents = mentionList
  }
  -- H.div
  --   [P.className "box"]
  --   [ H.pre
  --       []
  --       [ H.code
  --           []
  --           [H.text bodyTxt]
  --       ],
  --     depTitle,
  --     H.ul [] depList,
  --     mentionTitle,
  --     H.ul [] mentionList
  --   ]
  where
    depList :: [Ref]
    depList =
      let deps :: Set Reference
          deps =
                shallowDependencies ref (codeDependencies codeinfo)
       in namesToRefs deps
    mentionList :: [Ref]
    mentionList =
      let mentions :: Set Reference
          mentions =
                shallowReferences ref (codeDependencies codeinfo)
       in namesToRefs mentions
    -- viewLink :: (Text, Reference) -> Widget HTML Reference
    -- viewLink (name, ref) = do
    --   _ <-
    --     H.li
    --       [P.onClick]
    --       [ H.a
    --           []
    --           [H.text name]
    --       ]
    --   pure ref
    namesToRefs :: Set Reference -> [Ref]
    namesToRefs =
      List.sortOn primaryName . fmap (\r -> (refName r codeinfo)) . Set.toList
    -- bodyTxt :: Text
    -- bodyTxt =
    --       case Map.lookup ref (codeBodies codeinfo) of
    --         Nothing ->
    --           "<not found>"
    --         Just t ->
    --           syntaxToPlain t

refName :: Reference -> CodeInfo -> Ref
refName ref codeinfo =
  let (name, alt) = case Set.toAscList <$> Map.lookup ref (Relation.domain (codeDeclarationNames codeinfo)) of
        Nothing ->
          (showText ref, Set.empty)
        Just [] ->
          (showText ref, Set.empty)
        Just [n] ->
          (Name.toText n, Set.empty)
        Just (x : others) ->
          (Name.toText x, Set.fromList (map Name.toText others))
  in
  Ref { primaryName = name, rhash = R.toText ref, alt = alt }