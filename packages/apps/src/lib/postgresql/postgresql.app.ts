import { createApp } from "@lunnoa-automate/toolkit";
import { executeQuery } from "./actions/execute-query.action";
import { postgresqlConnection } from "./connections/postgresql.database";

export const postgresqlApp = createApp({
  id: "postgresql",
  name: "PostgreSQL",
  description: "Connect to and interact with PostgreSQL databases",
  logoUrl: "https://cdn.worldvectorlogo.com/logos/postgresql.svg",
  connections: [postgresqlConnection],
  actions: [executeQuery],
  triggers: [],
}); 