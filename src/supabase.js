import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  'https://styiiqvqbmioxgajsrlx.supabase.co';

const supabasePublishableKey =
  'sb_publishable_BQZOikAYTKDQJUWvgOmJsw_zmwGX4e3';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);