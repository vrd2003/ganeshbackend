const { createClient } = require('@supabase/supabase-js');

const connectDB = async () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  const { error } = await supabase.from('contributions').select('id').limit(1);
  if (error) throw error;
  console.log('Supabase Connected');
};

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://invalid.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'invalid-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

module.exports = { connectDB, supabase };
