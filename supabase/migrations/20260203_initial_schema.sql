-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Enhanced for Community)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_public BOOLEAN DEFAULT false,
  total_profit DECIMAL(12, 2) DEFAULT 0,
  total_bets INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Public profiles are viewable"
  ON users FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_public ON users(is_public) WHERE is_public = true;

-- ============================================
-- BOOKIES TABLE
-- ============================================
CREATE TABLE bookies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  current_balance DECIMAL(12, 2) DEFAULT 0,
  initial_deposit DECIMAL(12, 2) DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Bookies
ALTER TABLE bookies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own bookies only"
  ON bookies FOR ALL
  USING ((SELECT auth.uid()) = user_id);

-- Indexes
CREATE INDEX idx_bookies_user_id ON bookies(user_id);

-- ============================================
-- BETS TABLE
-- ============================================
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  bookie_id UUID REFERENCES bookies(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  bet_type TEXT DEFAULT 'single' CHECK (bet_type IN ('single', 'accumulator', 'system')),
  stake DECIMAL(12, 2) NOT NULL CHECK (stake > 0),
  odds DECIMAL(8, 2) NOT NULL CHECK (odds > 1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  potential_win DECIMAL(12, 2),
  actual_return DECIMAL(12, 2) DEFAULT 0,
  profit DECIMAL(12, 2),
  placed_at TIMESTAMPTZ DEFAULT NOW(),
  settled_at TIMESTAMPTZ,
  notes TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Bets
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own bets"
  ON bets FOR ALL
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Shared bets are viewable"
  ON bets FOR SELECT
  USING (is_shared = true);

-- Indexes
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_bookie_id ON bets(bookie_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_shared ON bets(is_shared) WHERE is_shared = true;

-- ============================================
-- BANKROLL TRANSACTIONS TABLE
-- ============================================
CREATE TABLE bankroll_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  bookie_id UUID REFERENCES bookies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'transfer', 'bet_win', 'bet_loss')),
  amount DECIMAL(12, 2) NOT NULL,
  balance_before DECIMAL(12, 2),
  balance_after DECIMAL(12, 2),
  description TEXT,
  related_bet_id UUID REFERENCES bets(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Transactions (STRICTEST)
ALTER TABLE bankroll_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Strict user-only access"
  ON bankroll_transactions FOR ALL
  USING ((SELECT auth.uid()) = user_id);

-- Index
CREATE INDEX idx_transactions_user_id ON bankroll_transactions(user_id);
CREATE INDEX idx_transactions_bookie_id ON bankroll_transactions(bookie_id);

-- ============================================
-- COMMUNITY FEATURES
-- ============================================

-- User Follows
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own follows"
  ON user_follows FOR ALL
  USING ((SELECT auth.uid()) = follower_id);

CREATE POLICY "Public can view follows"
  ON user_follows FOR SELECT
  USING (true);

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);

-- Betting Tips
CREATE TABLE betting_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sport TEXT,
  odds DECIMAL(8, 2),
  stake_recommendation DECIMAL(12, 2),
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  is_premium BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE betting_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tips"
  ON betting_tips FOR ALL
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Public tips viewable"
  ON betting_tips FOR SELECT
  USING (is_premium = false OR (SELECT auth.uid()) = user_id);

CREATE INDEX idx_tips_user_id ON betting_tips(user_id);
CREATE INDEX idx_tips_status ON betting_tips(status);

-- Tip Likes
CREATE TABLE tip_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID REFERENCES betting_tips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tip_id, user_id)
);

ALTER TABLE tip_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own likes"
  ON tip_likes FOR ALL
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Public can view likes"
  ON tip_likes FOR SELECT
  USING (true);

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Function to calculate potential win
CREATE OR REPLACE FUNCTION calculate_bet_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate potential win
  NEW.potential_win := NEW.stake * NEW.odds;
  
  -- Calculate actual return and profit based on status
  IF NEW.status = 'won' THEN
    NEW.actual_return := NEW.potential_win;
    NEW.profit := NEW.actual_return - NEW.stake;
  ELSIF NEW.status = 'lost' THEN
    NEW.actual_return := 0;
    NEW.profit := -NEW.stake;
  ELSIF NEW.status = 'void' THEN
    NEW.actual_return := NEW.stake;
    NEW.profit := 0;
  ELSE
    NEW.actual_return := 0;
    NEW.profit := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bet_calculate_values
BEFORE INSERT OR UPDATE ON bets
FOR EACH ROW
EXECUTE FUNCTION calculate_bet_values();

-- Function to update bookie balance
CREATE OR REPLACE FUNCTION update_bookie_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_bookie_balance DECIMAL(12, 2);
BEGIN
  -- Get current bookie balance
  SELECT current_balance INTO v_bookie_balance
  FROM bookies
  WHERE id = NEW.bookie_id AND user_id = NEW.user_id;
  
  -- When bet is placed, deduct stake
  IF TG_OP = 'INSERT' THEN
    UPDATE bookies
    SET current_balance = current_balance - NEW.stake
    WHERE id = NEW.bookie_id AND user_id = NEW.user_id;
    
    -- Create transaction record
    INSERT INTO bankroll_transactions (user_id, bookie_id, type, amount, balance_before, balance_after, description, related_bet_id)
    VALUES (NEW.user_id, NEW.bookie_id, 'bet_loss', -NEW.stake, v_bookie_balance, v_bookie_balance - NEW.stake, 'Bet placed: ' || NEW.description, NEW.id);
  END IF;
  
  -- When bet status changes to won/lost/void
  IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status != 'pending' THEN
    SELECT current_balance INTO v_bookie_balance
    FROM bookies
    WHERE id = NEW.bookie_id AND user_id = NEW.user_id;
    
    IF NEW.status = 'won' THEN
      UPDATE bookies
      SET current_balance = current_balance + NEW.actual_return
      WHERE id = NEW.bookie_id AND user_id = NEW.user_id;
      
      INSERT INTO bankroll_transactions (user_id, bookie_id, type, amount, balance_before, balance_after, description, related_bet_id)
      VALUES (NEW.user_id, NEW.bookie_id, 'bet_win', NEW.actual_return, v_bookie_balance, v_bookie_balance + NEW.actual_return, 'Bet won: ' || NEW.description, NEW.id);
    ELSIF NEW.status = 'void' THEN
      UPDATE bookies
      SET current_balance = current_balance + NEW.stake
      WHERE id = NEW.bookie_id AND user_id = NEW.user_id;
      
      INSERT INTO bankroll_transactions (user_id, bookie_id, type, amount, balance_before, balance_after, description, related_bet_id)
      VALUES (NEW.user_id, NEW.bookie_id, 'deposit', NEW.stake, v_bookie_balance, v_bookie_balance + NEW.stake, 'Bet voided: ' || NEW.description, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bet_balance_update
AFTER INSERT OR UPDATE ON bets
FOR EACH ROW
EXECUTE FUNCTION update_bookie_balance();

-- Function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET 
    total_bets = (SELECT COUNT(*) FROM bets WHERE user_id = NEW.user_id),
    total_profit = (SELECT COALESCE(SUM(profit), 0) FROM bets WHERE user_id = NEW.user_id AND status != 'pending'),
    win_rate = (
      SELECT CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('won', 'lost')) > 0 
        THEN (COUNT(*) FILTER (WHERE status = 'won')::DECIMAL / COUNT(*) FILTER (WHERE status IN ('won', 'lost'))::DECIMAL) * 100
        ELSE 0
      END
      FROM bets WHERE user_id = NEW.user_id
    )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bet_update_user_stats
AFTER INSERT OR UPDATE ON bets
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();

-- Function to update tip likes count
CREATE OR REPLACE FUNCTION update_tip_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE betting_tips
    SET likes_count = likes_count + 1
    WHERE id = NEW.tip_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE betting_tips
    SET likes_count = likes_count - 1
    WHERE id = OLD.tip_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tip_likes_count_update
AFTER INSERT OR DELETE ON tip_likes
FOR EACH ROW
EXECUTE FUNCTION update_tip_likes_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookies_updated_at BEFORE UPDATE ON bookies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bets_updated_at BEFORE UPDATE ON bets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tips_updated_at BEFORE UPDATE ON betting_tips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
