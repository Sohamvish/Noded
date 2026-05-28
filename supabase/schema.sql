-- =============================================================================
-- Noded: Skyblock Ironman Progression Mapper
-- Core Database Schema
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Custom Types
-- -----------------------------------------------------------------------------

CREATE TYPE recipe_type AS ENUM ('crafting', 'forge');

-- -----------------------------------------------------------------------------
-- Table: items (DAG nodes)
-- Each row represents one Skyblock item, ingested from the NEU repo.
-- -----------------------------------------------------------------------------

CREATE TABLE items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_id       TEXT UNIQUE NOT NULL,
  display_name      TEXT NOT NULL,
  category          TEXT,
  tier              TEXT,
  minecraft_item_id TEXT,
  npc_sell_price    NUMERIC,
  soulbound         BOOLEAN DEFAULT FALSE,
  parent_id         TEXT,
  slayer_req        TEXT,
  craft_text        TEXT,
  wiki_url          TEXT,
  texture_data      TEXT,
  raw_neu_data      JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Self-referential FK added after table creation to avoid ordering issues
ALTER TABLE items
  ADD CONSTRAINT fk_items_parent
  FOREIGN KEY (parent_id) REFERENCES items(internal_id)
  DEFERRABLE INITIALLY DEFERRED;

-- -----------------------------------------------------------------------------
-- Table: recipes (DAG edge groups)
-- One row per recipe. Items may have multiple recipes.
-- -----------------------------------------------------------------------------

CREATE TABLE recipes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_item_id    UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  type              recipe_type NOT NULL,
  result_count      INTEGER DEFAULT 1,
  duration_seconds  INTEGER,
  raw_recipe_data   JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Table: recipe_ingredients (DAG edges)
-- Normalized junction table: one row per ingredient per recipe.
-- -----------------------------------------------------------------------------

CREATE TABLE recipe_ingredients (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id               UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_item_id      UUID NOT NULL REFERENCES items(id),
  quantity                INTEGER NOT NULL DEFAULT 1,
  slot_position           TEXT
);

-- -----------------------------------------------------------------------------
-- Table: user_profiles
-- Linked to Supabase Auth. Caches Hypixel API data for offline use.
-- -----------------------------------------------------------------------------

CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  minecraft_uuid        TEXT UNIQUE,
  minecraft_username    TEXT,
  hypixel_profile_id    TEXT,
  profile_cute_name     TEXT,
  cached_collections    JSONB,
  cached_skills         JSONB,
  completed_items       TEXT[],
  last_api_sync_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Table: strategies
-- Community-driven META guides, strictly separated from game data (recipes).
-- -----------------------------------------------------------------------------

CREATE TABLE strategies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_internal_id    TEXT NOT NULL REFERENCES items(internal_id),
  title               TEXT NOT NULL,
  content_markdown    TEXT NOT NULL,
  author_id           UUID REFERENCES user_profiles(id),
  patch_version       TEXT,
  upvotes             INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Indexes for DAG traversal and lookups
-- -----------------------------------------------------------------------------

CREATE INDEX idx_items_internal_id   ON items(internal_id);
CREATE INDEX idx_items_parent        ON items(parent_id);
CREATE INDEX idx_items_category      ON items(category);
CREATE INDEX idx_recipes_result      ON recipes(result_item_id);
CREATE INDEX idx_ingredients_recipe  ON recipe_ingredients(recipe_id);
CREATE INDEX idx_ingredients_item    ON recipe_ingredients(ingredient_item_id);
CREATE INDEX idx_strategies_item     ON strategies(item_internal_id);
CREATE INDEX idx_user_profiles_mc    ON user_profiles(minecraft_uuid);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------

-- Items: public read, service-role write (ingestion pipeline only)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read items"
  ON items FOR SELECT
  USING (true);

-- Recipes: public read, service-role write
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read recipes"
  ON recipes FOR SELECT
  USING (true);

-- Recipe ingredients: public read, service-role write
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ingredients"
  ON recipe_ingredients FOR SELECT
  USING (true);

-- User profiles: users can only access their own row
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY "Users insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Strategies: public read, authenticated users manage their own
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read strategies"
  ON strategies FOR SELECT
  USING (true);
CREATE POLICY "Authors insert strategies"
  ON strategies FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors update strategies"
  ON strategies FOR UPDATE
  USING (auth.uid() = author_id);
CREATE POLICY "Authors delete strategies"
  ON strategies FOR DELETE
  USING (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- Helper: auto-update updated_at timestamp
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -----------------------------------------------------------------------------
-- Example: Recursive CTE for sub-graph extraction ("Target Focus")
-- Usage: SELECT * FROM get_dependency_tree('HYPERION');
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_dependency_tree(target_internal_id TEXT)
RETURNS TABLE (
  item_id         UUID,
  internal_id     TEXT,
  display_name    TEXT,
  depth           INTEGER,
  recipe_id       UUID,
  recipe_type     recipe_type,
  quantity        INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dep_tree AS (
    SELECT
      ri.ingredient_item_id AS item_id,
      i_ing.internal_id,
      i_ing.display_name,
      1 AS depth,
      r.id AS recipe_id,
      r.type AS recipe_type,
      ri.quantity
    FROM items i_target
    JOIN recipes r ON r.result_item_id = i_target.id
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    JOIN items i_ing ON i_ing.id = ri.ingredient_item_id
    WHERE i_target.internal_id = target_internal_id

    UNION ALL

    SELECT
      ri.ingredient_item_id AS item_id,
      i_ing.internal_id,
      i_ing.display_name,
      dt.depth + 1,
      r.id AS recipe_id,
      r.type AS recipe_type,
      ri.quantity
    FROM dep_tree dt
    JOIN recipes r ON r.result_item_id = dt.item_id
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    JOIN items i_ing ON i_ing.id = ri.ingredient_item_id
    WHERE dt.depth < 20
  )
  SELECT DISTINCT ON (dep_tree.item_id)
    dep_tree.item_id,
    dep_tree.internal_id,
    dep_tree.display_name,
    dep_tree.depth,
    dep_tree.recipe_id,
    dep_tree.recipe_type,
    dep_tree.quantity
  FROM dep_tree
  ORDER BY dep_tree.item_id, dep_tree.depth;
END;
$$ LANGUAGE plpgsql;
