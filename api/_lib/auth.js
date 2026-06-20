import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnvironment() {
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    const error = new Error("Supabase server environment variables are incomplete.");
    error.httpStatus = 500;
    throw error;
  }
}

export function getAdminClient() {
  assertEnvironment();
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function requireUser(request) {
  assertEnvironment();
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) {
    const error = new Error("Sign in is required.");
    error.httpStatus = 401;
    throw error;
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    const authError = new Error("Your session is invalid or expired. Sign in again.");
    authError.httpStatus = 401;
    throw authError;
  }
  return data.user;
}

export async function requireOwnedLocation(request, locationId) {
  const user = await requireUser(request);
  const admin = getAdminClient();
  const { data: location, error } = await admin
    .from("cf_locations")
    .select("*")
    .eq("id", locationId)
    .single();

  if (error || !location) {
    const notFound = new Error("Location not found.");
    notFound.httpStatus = 404;
    throw notFound;
  }
  if (location.user_id !== user.id) {
    const forbidden = new Error("You do not have access to this location.");
    forbidden.httpStatus = 403;
    throw forbidden;
  }
  return { user, location, admin };
}

export function sendApiError(response, error, label) {
  console.error(`${label}:`, error);
  return response.status(error.httpStatus || 500).json({
    error: error.message || "The request failed."
  });
}
