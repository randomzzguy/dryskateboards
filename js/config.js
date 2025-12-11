const SUPABASE_URL = 'https://miokevenjpbgzjrnfzfr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pb2tldmVuanBiZ3pqcm5memZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDMzMzEsImV4cCI6MjA4MDgxOTMzMX0.VFGR7jgF5HDsyrVWbc668epis8g3HE2MhvSex8nhH3k';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseClient = _supabase;
