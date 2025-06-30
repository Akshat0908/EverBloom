/*
  # EverBloom Database Schema

  1. New Tables
    - `users` - User profiles with subscription status and preferences
    - `relationships` - User's relationships with detailed preferences and metadata
    - `interaction_logs` - History of all interactions and communications
    - `ai_suggestions` - AI-generated suggestions with feedback tracking
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access only their own data
    
  3. Features
    - User authentication with subscription tiers
    - Relationship tracking with strength scoring
    - AI suggestion system with feedback loops
    - Comprehensive interaction logging
*/

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('FREE', 'PREMIUM', 'PLATINUM');
CREATE TYPE ai_tone AS ENUM ('WARM', 'EMPATHETIC', 'PRACTICAL');
CREATE TYPE relationship_type AS ENUM ('ROMANTIC', 'FAMILY', 'FRIEND', 'PROFESSIONAL', 'OTHER');
CREATE TYPE interaction_type AS ENUM ('GIFT_SENT', 'MESSAGE_SENT', 'DATE_PLANNED', 'CONVERSATION', 'REMINDER_RECEIVED', 'OTHER');
CREATE TYPE suggestion_type AS ENUM ('GIFT', 'ACTIVITY', 'MESSAGE_PROMPT', 'CONVERSATION_STARTER', 'COMMUNICATION_FEEDBACK');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  display_name text NOT NULL,
  relationship_type relationship_type NOT NULL,
  key_preferences_json jsonb DEFAULT '{}'::jsonb,
  important_dates_json jsonb DEFAULT '{}'::jsonb,
  last_interaction_date timestamptz,
  relationship_strength_score float DEFAULT 50 CHECK (relationship_strength_score >= 0 AND relationship_strength_score <= 100),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Interaction logs table
CREATE TABLE IF NOT EXISTS interaction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
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
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  relationship_id uuid REFERENCES relationships(id) ON DELETE CASCADE,
  suggestion_type suggestion_type NOT NULL,
  suggestion_text text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  is_acted_on boolean DEFAULT false,
  feedback_score integer CHECK (feedback_score >= 1 AND feedback_score <= 5),
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint for ai_suggestion_id
ALTER TABLE interaction_logs 
ADD CONSTRAINT fk_interaction_logs_ai_suggestion 
FOREIGN KEY (ai_suggestion_id) REFERENCES ai_suggestions(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_last_interaction ON relationships(last_interaction_date);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_relationship_id ON interaction_logs(relationship_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_timestamp ON interaction_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_relationship_id ON ai_suggestions(relationship_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Relationships policies
CREATE POLICY "Users can read own relationships" ON relationships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own relationships" ON relationships
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own relationships" ON relationships
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own relationships" ON relationships
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Interaction logs policies
CREATE POLICY "Users can read own interaction logs" ON interaction_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM relationships r 
      WHERE r.id = interaction_logs.relationship_id 
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own interaction logs" ON interaction_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM relationships r 
      WHERE r.id = interaction_logs.relationship_id 
      AND r.user_id = auth.uid()
    )
  );

-- AI suggestions policies
CREATE POLICY "Users can read own ai suggestions" ON ai_suggestions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ai suggestions" ON ai_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ai suggestions" ON ai_suggestions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Create function to update relationship strength score
CREATE OR REPLACE FUNCTION update_relationship_strength()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple scoring: days since last interaction affects strength
  -- If no interaction in 30+ days, score decreases
  -- Recent interactions boost score
  UPDATE relationships 
  SET relationship_strength_score = CASE
    WHEN NEW.last_interaction_date IS NULL THEN 30
    WHEN EXTRACT(DAY FROM NOW() - NEW.last_interaction_date) <= 3 THEN LEAST(relationship_strength_score + 10, 100)
    WHEN EXTRACT(DAY FROM NOW() - NEW.last_interaction_date) <= 7 THEN LEAST(relationship_strength_score + 5, 100)
    WHEN EXTRACT(DAY FROM NOW() - NEW.last_interaction_date) > 30 THEN GREATEST(relationship_strength_score - 15, 0)
    ELSE relationship_strength_score
  END,
  updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update relationship strength
CREATE TRIGGER trigger_update_relationship_strength
  AFTER UPDATE OF last_interaction_date ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_relationship_strength();