export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      merchants: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          business_name: string | null;
          business_type: string | null;
          plan: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          business_name?: string | null;
          business_type?: string | null;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          business_name?: string | null;
          business_type?: string | null;
          plan?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quizzes: {
        Row: {
          id: string;
          merchant_id: string;
          name: string;
          business_type: string | null;
          free_gift: string | null;
          questions: Json;
          is_active: boolean;
          theme: string;
          business_description: string | null;
          emojis_enabled: boolean;
          target_age_range: string;
          custom_color_primary: string | null;
          custom_color_background: string | null;
          custom_color_text: string | null;
          theme_config: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          name: string;
          business_type?: string | null;
          free_gift?: string | null;
          questions?: Json;
          is_active?: boolean;
          theme?: string;
          business_description?: string | null;
          emojis_enabled?: boolean;
          target_age_range?: string;
          custom_color_primary?: string | null;
          custom_color_background?: string | null;
          custom_color_text?: string | null;
          theme_config?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          name?: string;
          business_type?: string | null;
          free_gift?: string | null;
          questions?: Json;
          is_active?: boolean;
          theme?: string;
          business_description?: string | null;
          emojis_enabled?: boolean;
          target_age_range?: string;
          custom_color_primary?: string | null;
          custom_color_background?: string | null;
          custom_color_text?: string | null;
          theme_config?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      responses: {
        Row: {
          id: string;
          quiz_id: string;
          merchant_id: string;
          customer_first_name: string | null;
          customer_age: number | null;
          customer_gender: string | null;
          customer_birth_month: number | null;
          customer_birth_year: number | null;
          redemption_code: string | null;
          answers: Json;
          completed_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          merchant_id: string;
          customer_first_name?: string | null;
          customer_age?: number | null;
          customer_gender?: string | null;
          customer_birth_month?: number | null;
          customer_birth_year?: number | null;
          redemption_code?: string | null;
          answers?: Json;
          completed_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          merchant_id?: string;
          customer_first_name?: string | null;
          customer_age?: number | null;
          customer_gender?: string | null;
          customer_birth_month?: number | null;
          customer_birth_year?: number | null;
          redemption_code?: string | null;
          answers?: Json;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "responses_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responses_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

