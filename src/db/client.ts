import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: `file:${process.env.DATABASE_PATH || "./topflight.db"}`,
});

export const db = drizzle(client, { schema });
export { schema, client as sqlite };
