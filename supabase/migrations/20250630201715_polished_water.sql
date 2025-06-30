/*
  # EverBloom Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `name` (text)
      - `subscription_status` (enum: FREE, PREMIUM, PLATINUM)
      - `notification_preferences` (jsonb)
      - `preferred_ai_tone` (enum: WARM, EMPATHETIC, PRACTICAL)
      - `locale` (text, default 'en-US')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `last_login` (timestamptz)

    - `relationships`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `display_name` (text)
      - `relationship_type` (enum: ROMANTIC, FAMILY, FRIEND, PROFESSIONAL, OTHER)
      - `key_preferences_json` (jsonb)
      - `important_dates_json` (jsonb)
      - `last_interaction_date` (timestamptz)
      - `relationship_strength_score` (integer, 0-100)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `interaction_logs`
      - `id` (uuid, primary key)
      - `relationship_id` (uuid, foreign key to relationships)
      - `timestamp` (timestamptz)
      - `interaction_type` (enum: GIFT_SENT, MESSAGE_SENT, DATE_PLANNED, CONVERSATION, REMINDER_RECEIVED, OTHER)
      - `description` (text)
      - `ai_sentiment_analysis` (jsonb)
      - `ai_suggestion_id` (uuid, foreign key to ai_suggestions)
      - `created_at` (timestamptz)

    - `ai_suggestions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `relationship_id` (uuid, foreign key to relationships)
      - `suggestion_type` (enum: GIFT, ACTIVITY, MESSAGE_PROMPT, CONVERSATION_STARTER, COMMUNICATION_FEEDBACK)
      - `suggestion_text` (text)
      - `generated_at` (timestamptz)
      - `is_acted_on` (boolean)
      - `feedback_score` (integer, 1-5)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for relationship-based access

  3. Indexes
    - Performance indexes on frequently queried columns
    - Composite indexes for common query patterns
*/

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('FREE', 'PREMIUM', 'PLATINUM');
CREATE TYPE ai_tone AS ENUM ('WARM', 'EMPATHETIC', 'PRACTICAL');
CREATE TYPE relationship_type AS ENUM ('ROMANTIC', 'FAMILY', 'FRIEND', 'PROFESSIONAL', 'OTHER');
CREATE TYPE interaction_type AS ENUM ('GIFT_SENT', 'MESSAGE_SENT', 'DATE_PLANNED', 'CONVERSATION', 'REMINDER_RECEIVED', 'OTHER');
CREATE TYPE suggestion_type AS ENUM ('GIFT', 'ACTIVITY', 'MESSAGE_PROMPT', 'CONVERSATION_STARTER', 'COMMUNICATION_FEEDBACK');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  password_hash text,
  name text NOT NULL,
  subscription_status subscription_status DEFAULT 'FREE',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  notification_preferences jsonb DEFAULT '{"email": true, "push": true, "frequency": "daily"}'::jsonb,
  preferred_ai_tone ai_tone DEFAULT 'WARM',
  locale text DEFAULT 'en-US',
  updated_at timestamptz DEFAULT now()
);

-- Relationships table
CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  relationship_type relationship_type NOT NULL,
  key_preferences_json jsonb DEFAULT '{}'::jsonb,
  important_dates_json jsonb DEFAULT '{}'::jsonb,
  last_interaction_date timestamptz,
  relationship_strength_score integer DEFAULT 50 CHECK (relationship_strength_score >= 0 AND relationship_strength_score <= 100),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interaction logs table
CREATE TABLE IF NOT EXISTS interaction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  interaction_type interaction_type NOT NULL,
  description text NOT NULL,
  ai_sentiment_analysis jsonb DEFAULT '{}'::jsonb,
  ai_suggestion_id uuid,
  created_at timestamptz DEFAULT now()
);

-- AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_id uuid REFERENCES relationships(id) ON DELETE CASCADE,
  suggestion_type suggestion_type NOT NULL,
  suggestion_text text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  is_acted_on boolean DEFAULT false,
  feedback_score integer CHECK (feedback_score >= 1 AND feedback_score <= 5),
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for ai_suggestion_id after table creation
ALTER TABLE interaction_logs 
ADD CONSTRAINT fk_interaction_logs_ai_suggestion 
FOREIGN KEY (ai_suggestion_id) REFERENCES ai_suggestions(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Relationships policies
CREATE POLICY "Users can read own relationships"
  ON relationships
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own relationships"
  ON relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own relationships"
  ON relationships
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own relationships"
  ON relationships
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Interaction logs policies
CREATE POLICY "Users can read own interaction logs"
  ON interaction_logs
  FOR SELECT
  TO authenticated
  USING (
    relationship_id IN (
      SELECT id FROM relationships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own interaction logs"
  ON interaction_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    relationship_id IN (
      SELECT id FROM relationships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own interaction logs"
  ON interaction_logs
  FOR UPDATE
  TO authenticated
  USING (
    relationship_id IN (
      SELECT id FROM relationships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own interaction logs"
  ON interaction_logs
  FOR DELETE
  TO authenticated
  USING (
    relationship_id IN (
      SELECT id FROM relationships WHERE user_id = auth.uid()
    )
  );

-- AI suggestions policies
CREATE POLICY "Users can read own ai suggestions"
  ON ai_suggestions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ai suggestions"
  ON ai_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ai suggestions"
  ON ai_suggestions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own ai suggestions"
  ON ai_suggestions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_strength ON relationships(relationship_strength_score);
CREATE INDEX IF NOT EXISTS idx_relationships_last_interaction ON relationships(last_interaction_date);

CREATE INDEX IF NOT EXISTS idx_interaction_logs_relationship_id ON interaction_logs(relationship_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_timestamp ON interaction_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_type ON interaction_logs(interaction_type);

CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_relationship_id ON ai_suggestions(relationship_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_type ON ai_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_generated_at ON ai_suggestions(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_acted_on ON ai_suggestions(is_acted_on);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_relationships_user_strength ON relationships(user_id, relationship_strength_score DESC);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_relationship_timestamp ON interaction_logs(relationship_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_generated ON ai_suggestions(user_id, generated_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at 
  BEFORE UPDATE ON relationships 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();