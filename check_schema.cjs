
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kptjvyhrggiouotjydkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdGp2eWhyZ2dpb3VvdGp5ZGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk1MjIsImV4cCI6MjA4NTYxNTUyMn0.HhGBFW1qXkFUzezrXtHQeCkqfEk0eKrGdZf6gAIylE8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log("Checking 'tickets' table schema...");
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
    if ('is_deleted' in data[0]) {
        console.log("✅ 'is_deleted' column exists!");
    } else {
        console.log("❌ 'is_deleted' column DOES NOT exist!");
    }
  } else {
    console.log("No data in 'tickets' table to check schema.");
  }
}

checkSchema();
