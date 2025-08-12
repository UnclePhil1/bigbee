// Test script to verify Supabase connection and table access
// Run this with: node test-supabase.js

import { createClient } from '@supabase/supabase-js';

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');
  
  try {
    // Test 1: Check if we can connect
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful');
    
    // Test 2: Check if tables exist
    console.log('\n2. Checking if required tables exist...');
    
    const tables = ['users', 'user_progress', 'multiplayer_sessions'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}' not found or not accessible:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and is accessible`);
        }
      } catch (err) {
        console.log(`❌ Error accessing table '${table}':`, err.message);
      }
    }
    
    // Test 3: Try to insert a test user
    console.log('\n3. Testing user insertion...');
    const testWallet = 'test_wallet_' + Date.now();
    const { error: insertError } = await supabase
      .from('users')
      .upsert([{ wallet_address: testWallet, username: 'test_user' }]);
    
    if (insertError) {
      console.log('❌ User insertion failed:', insertError.message);
    } else {
      console.log('✅ User insertion successful');
      
      // Test 4: Try to insert user progress
      console.log('\n4. Testing user progress insertion...');
      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert([{
          wallet_address: testWallet,
          completed_stages: [1, 2],
          total_xp: 150,
          total_honey: 300,
          current_stage: 3
        }]);
      
      if (progressError) {
        console.log('❌ User progress insertion failed:', progressError.message);
      } else {
        console.log('✅ User progress insertion successful');
      }
      
      // Clean up test data
      console.log('\n5. Cleaning up test data...');
      await supabase.from('user_progress').delete().eq('wallet_address', testWallet);
      await supabase.from('users').delete().eq('wallet_address', testWallet);
      console.log('✅ Test data cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSupabaseConnection();
