import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string | null;
          name: string;
          subscription_status: 'FREE' | 'PREMIUM' | 'PLATINUM';
          created_at: string;
          last_login: string | null;
          notification_preferences: any;
          preferred_ai_tone: 'WARM' | 'EMPATHETIC' | 'PRACTICAL';
          locale: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash?: string | null;
          name: string;
          subscription_status?: 'FREE' | 'PREMIUM' | 'PLATINUM';
          created_at?: string;
          last_login?: string | null;
          notification_preferences?: any;
          preferred_ai_tone?: 'WARM' | 'EMPATHETIC' | 'PRACTICAL';
          locale?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string | null;
          name?: string;
          subscription_status?: 'FREE' | 'PREMIUM' | 'PLATINUM';
          created_at?: string;
          last_login?: string | null;
          notification_preferences?: any;
          preferred_ai_tone?: 'WARM' | 'EMPATHETIC' | 'PRACTICAL';
          locale?: string;
          updated_at?: string;
        };
      };
      relationships: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          relationship_type: 'ROMANTIC' | 'FAMILY' | 'FRIEND' | 'PROFESSIONAL' | 'OTHER';
          key_preferences_json: any;
          important_dates_json: any;
          last_interaction_date: string | null;
          relationship_strength_score: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          relationship_type: 'ROMANTIC' | 'FAMILY' | 'FRIEND' | 'PROFESSIONAL' | 'OTHER';
          key_preferences_json?: any;
          important_dates_json?: any;
          last_interaction_date?: string | null;
          relationship_strength_score?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string;
          relationship_type?: 'ROMANTIC' | 'FAMILY' | 'FRIEND' | 'PROFESSIONAL' | 'OTHER';
          key_preferences_json?: any;
          important_dates_json?: any;
          last_interaction_date?: string | null;
          relationship_strength_score?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      interaction_logs: {
        Row: {
          id: string;
          relationship_id: string;
          timestamp: string;
          interaction_type: 'GIFT_SENT' | 'MESSAGE_SENT' | 'DATE_PLANNED' | 'CONVERSATION' | 'REMINDER_RECEIVED' | 'OTHER';
          description: string;
          ai_sentiment_analysis: any;
          ai_suggestion_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          relationship_id: string;
          timestamp?: string;
          interaction_type: 'GIFT_SENT' | 'MESSAGE_SENT' | 'DATE_PLANNED' | 'CONVERSATION' | 'REMINDER_RECEIVED' | 'OTHER';
          description: string;
          ai_sentiment_analysis?: any;
          ai_suggestion_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          relationship_id?: string;
          timestamp?: string;
          interaction_type?: 'GIFT_SENT' | 'MESSAGE_SENT' | 'DATE_PLANNED' | 'CONVERSATION' | 'REMINDER_RECEIVED' | 'OTHER';
          description?: string;
          ai_sentiment_analysis?: any;
          ai_suggestion_id?: string | null;
          created_at?: string;
        };
      };
      ai_suggestions: {
        Row: {
          id: string;
          user_id: string;
          relationship_id: string | null;
          suggestion_type: 'GIFT' | 'ACTIVITY' | 'MESSAGE_PROMPT' | 'CONVERSATION_STARTER' | 'COMMUNICATION_FEEDBACK';
          suggestion_text: string;
          generated_at: string;
          is_acted_on: boolean;
          feedback_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          relationship_id?: string | null;
          suggestion_type: 'GIFT' | 'ACTIVITY' | 'MESSAGE_PROMPT' | 'CONVERSATION_STARTER' | 'COMMUNICATION_FEEDBACK';
          suggestion_text: string;
          generated_at?: string;
          is_acted_on?: boolean;
          feedback_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          relationship_id?: string | null;
          suggestion_type?: 'GIFT' | 'ACTIVITY' | 'MESSAGE_PROMPT' | 'CONVERSATION_STARTER' | 'COMMUNICATION_FEEDBACK';
          suggestion_text?: string;
          generated_at?: string;
          is_acted_on?: boolean;
          feedback_score?: number | null;
          created_at?: string;
        };
      };
    };
  };
};