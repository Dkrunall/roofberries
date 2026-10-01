// Hand-written to match supabase/migrations/0001_schema.sql exactly.
// If the schema changes, update this file (and, once you have the
// Supabase CLI linked, you can instead generate it with
// `supabase gen types typescript --linked > src/types/database.ts`).
//
// Shape (Tables/Views/Functions/Enums/CompositeTypes + per-table
// Relationships) intentionally mirrors what `supabase gen types` produces —
// the Supabase JS client's nested-select type inference (e.g. embedding
// menu_items under categories) silently collapses to `never` if any of
// this is missing, even though it isn't needed at runtime.

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'served';
export type AdminRole = 'manager' | 'kitchen';
export type DietaryType = 'veg' | 'non_veg' | 'egg' | 'seafood';
export type ServiceRequestType = 'call_waiter' | 'request_bill';
export type ServiceRequestStatus = 'pending' | 'acknowledged';

export interface Database {
  public: {
    Tables: {
      tables: {
        Row: {
          id: string;
          table_number: number;
          qr_code_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_number: number;
          qr_code_url?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tables']['Insert']>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          section: string;
          sort_order: number;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          section: string;
          sort_order?: number;
          image_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          dietary_type: DietaryType | null;
          is_alcoholic: boolean;
          is_available: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          dietary_type?: DietaryType | null;
          is_alcoholic?: boolean;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['menu_items']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'menu_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_item_variants: {
        Row: {
          id: string;
          menu_item_id: string;
          label: string;
          price: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_item_id: string;
          label: string;
          price: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['menu_item_variants']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'menu_item_variants_menu_item_id_fkey';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          table_id: string;
          status: OrderStatus;
          created_at: string;
          served_at: string | null;
        };
        Insert: {
          id?: string;
          table_id: string;
          status?: OrderStatus;
          created_at?: string;
          served_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'orders_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'tables';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          variant_id: string | null;
          quantity: number;
          notes: string | null;
          price_at_order: number;
          status: OrderStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          variant_id?: string | null;
          quantity: number;
          notes?: string | null;
          price_at_order: number;
          status?: OrderStatus;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_menu_item_id_fkey';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'menu_item_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: AdminRole;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: AdminRole;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['admin_users']['Insert']>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          table_id: string;
          guest_id: string;
          guest_name: string;
          menu_item_id: string;
          menu_item_name: string;
          category_name: string;
          variant_id: string | null;
          variant_label: string | null;
          unit_price: number;
          quantity: number;
          notes: string;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          guest_id: string;
          guest_name?: string;
          menu_item_id: string;
          menu_item_name: string;
          category_name: string;
          variant_id?: string | null;
          variant_label?: string | null;
          unit_price: number;
          quantity: number;
          notes?: string;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'cart_items_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'tables';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_menu_item_id_fkey';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'menu_item_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      order_feedback: {
        Row: {
          id: string;
          order_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['order_feedback']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'order_feedback_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      service_requests: {
        Row: {
          id: string;
          table_id: string;
          type: ServiceRequestType;
          status: ServiceRequestStatus;
          created_at: string;
          acknowledged_at: string | null;
        };
        Insert: {
          id?: string;
          table_id: string;
          type: ServiceRequestType;
          status?: ServiceRequestStatus;
          created_at?: string;
          acknowledged_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['service_requests']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'service_requests_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'tables';
            referencedColumns: ['id'];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          order_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['push_subscriptions']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      order_status: OrderStatus;
      admin_role: AdminRole;
      dietary_type: DietaryType;
      service_request_type: ServiceRequestType;
      service_request_status: ServiceRequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
