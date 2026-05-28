-- =============================================================================
-- Phase 3.1: Target Focus subgraph extraction
-- Adapted to Noded schema (UUID FKs on items.id, internal_id as public key)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_dependency_subgraph(
  target_internal_id TEXT,
  expand_bases BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  result_internal_id TEXT,
  ingredient_internal_id TEXT,
  recipe_id TEXT,
  recipe_type TEXT,
  quantity NUMERIC,
  depth INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dependency_tree AS (
    -- Anchor: target item at depth 0 (no ingredient edge)
    SELECT
      target_internal_id AS result_internal_id,
      NULL::TEXT AS ingredient_internal_id,
      NULL::TEXT AS recipe_id,
      NULL::TEXT AS recipe_type,
      NULL::NUMERIC AS quantity,
      0 AS depth

    UNION ALL

    -- Recursive: expand recipes for the frontier item
    SELECT
      i_result.internal_id AS result_internal_id,
      i_ing.internal_id AS ingredient_internal_id,
      r.id::TEXT AS recipe_id,
      r.type::TEXT AS recipe_type,
      ri.quantity::NUMERIC AS quantity,
      dt.depth + 1 AS depth
    FROM dependency_tree dt
    -- Depth 0: expand target (ingredient is null). Depth 1+: expand prior ingredient.
    JOIN items i_expand ON i_expand.internal_id = COALESCE(
      dt.ingredient_internal_id,
      dt.result_internal_id
    )
    JOIN recipes r ON r.result_item_id = i_expand.id
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    JOIN items i_result ON i_result.id = r.result_item_id
    JOIN items i_ing ON i_ing.id = ri.ingredient_item_id
    WHERE dt.depth < 20
      AND (
        expand_bases = TRUE
        OR dt.depth = 0
        OR COALESCE(dt.ingredient_internal_id, '') NOT LIKE 'ENCHANTED\_%' ESCAPE '\'
      )
  )
  SELECT
    dependency_tree.result_internal_id,
    dependency_tree.ingredient_internal_id,
    dependency_tree.recipe_id,
    dependency_tree.recipe_type,
    dependency_tree.quantity,
    dependency_tree.depth
  FROM dependency_tree;
END;
$$;

-- Allow anon/authenticated callers to invoke via PostgREST (service role always can)
GRANT EXECUTE ON FUNCTION get_dependency_subgraph(TEXT, BOOLEAN) TO anon, authenticated;
