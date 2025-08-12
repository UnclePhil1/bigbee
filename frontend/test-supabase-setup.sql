-- Test script to verify Supabase setup
-- Run this in your Supabase SQL Editor after the main setup

-- Test 1: Insert a test user
INSERT INTO users (wallet_address, username) 
VALUES ('test_wallet_123', 'TestPlayer')
ON CONFLICT (wallet_address) DO NOTHING;

-- Test 2: Check if user_progress was automatically created
SELECT 
    u.wallet_address,
    u.username,
    up.current_stage,
    up.total_xp,
    up.loyalty_tier
FROM users u
LEFT JOIN user_progress up ON u.wallet_address = up.wallet_address
WHERE u.wallet_address = 'test_wallet_123';

-- Test 3: Update some progress data
UPDATE user_progress 
SET 
    total_xp = 100,
    total_honey = 50,
    current_stage = 2,
    stage_1_honey = 15,
    loyalty_tier = 'Worker Bee'
WHERE wallet_address = 'test_wallet_123';

-- Test 4: Verify the update worked
SELECT 
    wallet_address,
    total_xp,
    total_honey,
    current_stage,
    stage_1_honey,
    loyalty_tier,
    updated_at
FROM user_progress 
WHERE wallet_address = 'test_wallet_123';

-- Test 5: Test the stage statistics function
SELECT update_stage_statistics('test_wallet_123', 2, 20, 0);

-- Test 6: Verify stage statistics update
SELECT 
    wallet_address,
    stage_1_honey,
    stage_2_honey,
    stage_3_honey,
    stage_4_distance
FROM user_progress 
WHERE wallet_address = 'test_wallet_123';

-- Test 7: Check table row counts
SELECT 
    'users' as table_name,
    COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
    'user_progress' as table_name,
    COUNT(*) as row_count
FROM user_progress
UNION ALL
SELECT 
    'multiplayer_sessions' as table_name,
    COUNT(*) as row_count
FROM multiplayer_sessions;

-- Test 8: Check if triggers are working (updated_at should be recent)
SELECT 
    wallet_address,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (updated_at - created_at)) as seconds_since_creation
FROM user_progress 
WHERE wallet_address = 'test_wallet_123';
