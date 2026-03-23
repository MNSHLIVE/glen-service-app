
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kptjvyhrggiouotjydkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdGp2eWhyZ2dpb3VvdGp5ZGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMzk1MjIsImV4cCI6MjA4NTYxNTUyMn0.HhGBFW1qXkFUzezrXtHQeCkqfEk0eKrGdZf6gAIylE8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log("Listing tables and testing existence...");
  const tables = ['tickets', 'technicians', 'feedback', 'attendance', 'inventory_requests', 'parts'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table '${table}' error: ${error.message}`);
    } else {
      console.log(`✅ Table '${table}' exists. Rows found: ${data.length}`);
    }
  }
}

listTables();
