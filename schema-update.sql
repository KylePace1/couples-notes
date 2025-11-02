-- Add reactions column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

-- Create user stats table for gamification
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  total_notes INTEGER DEFAULT 0,
  total_reactions INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_post_date DATE,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for user_stats
CREATE POLICY "Allow all operations on user_stats" ON user_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user stats when a note is added
  INSERT INTO user_stats (username, total_notes, points, level)
  VALUES (NEW.author, 1, 10, 1)
  ON CONFLICT (username)
  DO UPDATE SET
    total_notes = user_stats.total_notes + 1,
    points = user_stats.points + 10,
    level = FLOOR((user_stats.points + 10) / 50) + 1,
    last_post_date = CURRENT_DATE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for note insertion
DROP TRIGGER IF EXISTS update_stats_on_note ON notes;
CREATE TRIGGER update_stats_on_note
  AFTER INSERT ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();
