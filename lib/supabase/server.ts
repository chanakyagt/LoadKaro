import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function createClient() {
  const cookieStore = await cookies();
  // #region agent log
  const _caller = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
  fetch('http://127.0.0.1:7242/ingest/df94f26b-3bb0-4d8c-abf5-46d92f1f349e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:createClient',message:'createClient called',data:{caller:_caller},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/df94f26b-3bb0-4d8c-abf5-46d92f1f349e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:set',message:'cookie SET called',data:{cookieName:name,caller:new Error().stack?.split('\n').slice(1,4).join(' | ')},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/df94f26b-3bb0-4d8c-abf5-46d92f1f349e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/server.ts:remove',message:'cookie REMOVE called',data:{cookieName:name,caller:new Error().stack?.split('\n').slice(1,4).join(' | ')},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  return supabase;
}

