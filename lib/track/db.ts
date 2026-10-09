import { neon } from "@neondatabase/serverless";

// Neon over HTTP. Created on first use so builds without the env still pass.
let client: ReturnType<typeof neon> | null = null;

export function sql() {
  if (!client) client = neon(process.env.DATABASE_URL!);
  return client;
}
