import { pgTable, varchar, uuid } from "drizzle-orm/pg-core";

export const User = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").notNull(),
});
