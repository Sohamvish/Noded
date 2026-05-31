/** Browse sidebar: skill columns and progression layers. */

export interface BrowseSkill {
  id: string;
  displayName: string;
  sortOrder: number;
  color: string | null;
}

export interface BrowseLayerSummary {
  layer: number;
  label: string;
  curatedCount: number;
  inferredCount: number;
  totalCount: number;
}

export interface BrowseItem {
  internalId: string;
  displayName: string;
  tier: string | null;
  mapLabel: string;
  /** Curated milestone from roadmap_items vs tier/category inference. */
  source: "curated" | "inferred";
  sortOrder: number;
}

export interface BrowseSkillsResponse {
  skills: BrowseSkill[];
}

export interface BrowseCountsResponse {
  skillId: string;
  layers: BrowseLayerSummary[];
}

export interface BrowseItemsResponse {
  skillId: string;
  layer: number;
  curated: BrowseItem[];
  inferred: BrowseItem[];
  inferredOffset: number;
  inferredLimit: number;
  inferredTotal: number;
  hasMoreInferred: boolean;
}
