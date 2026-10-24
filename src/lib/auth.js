import { ref } from "vue";
import { supabase } from "./supabase";

export const user = ref(null);

function toUser(session) {
  return session?.user ?? null;
}

supabase.auth.getSession().then(({ data }) => {
  user.value = toUser(data.session);
});

supabase.auth.onAuthStateChange((_event, session) => {
  user.value = toUser(session);
});

export function userDisplayName(authUser) {
  return (
    authUser?.user_metadata?.full_name ?? authUser?.user_metadata?.name ?? authUser?.email ?? ""
  );
}

export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: "google" });
}

export function signOut() {
  return supabase.auth.signOut();
}
