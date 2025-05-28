import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Todo {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  date: string;
  created_at: string;
}
