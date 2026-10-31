import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};
export const database = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  options,
);
// A fresh anonymous Auth client per operation prevents cross-user session leakage.
export const authClient = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, options);
export const KTA_BUCKET = "lawyer-kta";
