-- =============================================================================
-- Curated browse taxonomy: skills + milestone items for CategoryNav
-- =============================================================================

CREATE TABLE roadmap_skills (
  id           TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  sort_order   INT NOT NULL,
  color        TEXT
);

CREATE TABLE roadmap_items (
  internal_id    TEXT PRIMARY KEY REFERENCES items(internal_id) ON DELETE CASCADE,
  skill_id       TEXT NOT NULL REFERENCES roadmap_skills(id) ON DELETE CASCADE,
  layer          INT NOT NULL CHECK (layer BETWEEN 1 AND 5),
  sort_order     INT NOT NULL DEFAULT 0,
  label_override TEXT
);

CREATE INDEX idx_roadmap_items_skill_layer ON roadmap_items(skill_id, layer, sort_order);

-- Public read (same model as items/recipes)
ALTER TABLE roadmap_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roadmap_skills"
  ON roadmap_skills FOR SELECT
  USING (true);

ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read roadmap_items"
  ON roadmap_items FOR SELECT
  USING (true);
