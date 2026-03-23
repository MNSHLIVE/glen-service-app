
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple parser for .env file since it's just a couple of keys
const envContent = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log("Checking 'tickets' table columns...");
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .limit(1);

  if (error) {
    console.error("❌ Error fetching tickets:", error);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log("Available columns in 'tickets':", Object.keys(data[0]));
  } else {
    console.log("No data in 'tickets' table to check columns.");
  }
}

checkColumns();
