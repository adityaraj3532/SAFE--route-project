import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zwotkgjeksujrrotuueb.supabase.co';
const supabaseAnonKey = 'sb_publishable_AoBLeRGikOZlfAcqpkZF2w_Q2eibkHt';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);