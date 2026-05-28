export type RecipeType = "crafting" | "forge";

export interface Database {
  public: {
    Views: Record<string, never>;
    Tables: {
      items: {
        Relationships: [];
        Row: {
          id: string;
          internal_id: string;
          display_name: string;
          category: string | null;
          tier: string | null;
          minecraft_item_id: string | null;
          npc_sell_price: number | null;
          soulbound: boolean;
          parent_id: string | null;
          slayer_req: string | null;
          craft_text: string | null;
          wiki_url: string | null;
          texture_data: string | null;
          raw_neu_data: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          internal_id: string;
          display_name: string;
          category?: string | null;
          tier?: string | null;
          minecraft_item_id?: string | null;
          npc_sell_price?: number | null;
          soulbound?: boolean;
          parent_id?: string | null;
          slayer_req?: string | null;
          craft_text?: string | null;
          wiki_url?: string | null;
          texture_data?: string | null;
          raw_neu_data?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          internal_id?: string;
          display_name?: string;
          category?: string | null;
          tier?: string | null;
          minecraft_item_id?: string | null;
          npc_sell_price?: number | null;
          soulbound?: boolean;
          parent_id?: string | null;
          slayer_req?: string | null;
          craft_text?: string | null;
          wiki_url?: string | null;
          texture_data?: string | null;
          raw_neu_data?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipes: {
        Relationships: [];
        Row: {
          id: string;
          result_item_id: string;
          type: RecipeType;
          result_count: number;
          duration_seconds: number | null;
          raw_recipe_data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          result_item_id: string;
          type: RecipeType;
          result_count?: number;
          duration_seconds?: number | null;
          raw_recipe_data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          result_item_id?: string;
          type?: RecipeType;
          result_count?: number;
          duration_seconds?: number | null;
          raw_recipe_data?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      recipe_ingredients: {
        Relationships: [];
        Row: {
          id: string;
          recipe_id: string;
          ingredient_item_id: string;
          quantity: number;
          slot_position: string | null;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          ingredient_item_id: string;
          quantity?: number;
          slot_position?: string | null;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          ingredient_item_id?: string;
          quantity?: number;
          slot_position?: string | null;
        };
      };
      user_profiles: {
        Relationships: [];
        Row: {
          id: string;
          minecraft_uuid: string | null;
          minecraft_username: string | null;
          hypixel_profile_id: string | null;
          profile_cute_name: string | null;
          cached_collections: Record<string, number> | null;
          cached_skills: Record<string, number> | null;
          completed_items: string[] | null;
          last_api_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          minecraft_uuid?: string | null;
          minecraft_username?: string | null;
          hypixel_profile_id?: string | null;
          profile_cute_name?: string | null;
          cached_collections?: Record<string, number> | null;
          cached_skills?: Record<string, number> | null;
          completed_items?: string[] | null;
          last_api_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          minecraft_uuid?: string | null;
          minecraft_username?: string | null;
          hypixel_profile_id?: string | null;
          profile_cute_name?: string | null;
          cached_collections?: Record<string, number> | null;
          cached_skills?: Record<string, number> | null;
          completed_items?: string[] | null;
          last_api_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      strategies: {
        Relationships: [];
        Row: {
          id: string;
          item_internal_id: string;
          title: string;
          content_markdown: string;
          author_id: string | null;
          patch_version: string | null;
          upvotes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_internal_id: string;
          title: string;
          content_markdown: string;
          author_id?: string | null;
          patch_version?: string | null;
          upvotes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_internal_id?: string;
          title?: string;
          content_markdown?: string;
          author_id?: string | null;
          patch_version?: string | null;
          upvotes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_dependency_tree: {
        Args: { target_internal_id: string };
        Returns: {
          item_id: string;
          internal_id: string;
          display_name: string;
          depth: number;
          recipe_id: string;
          recipe_type: RecipeType;
          quantity: number;
        }[];
      };
      get_dependency_subgraph: {
        Args: {
          target_internal_id: string;
          expand_bases?: boolean;
        };
        Returns: {
          result_internal_id: string;
          ingredient_internal_id: string | null;
          recipe_id: string | null;
          recipe_type: string | null;
          quantity: number | null;
          depth: number;
        }[];
      };
    };
    Enums: {
      recipe_type: RecipeType;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience aliases
export type Item = Database["public"]["Tables"]["items"]["Row"];
export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];
export type RecipeIngredient = Database["public"]["Tables"]["recipe_ingredients"]["Row"];
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type Strategy = Database["public"]["Tables"]["strategies"]["Row"];

export type DependencyNode = Database["public"]["Functions"]["get_dependency_tree"]["Returns"][number];
export type DependencySubgraphRow =
  Database["public"]["Functions"]["get_dependency_subgraph"]["Returns"][number];
