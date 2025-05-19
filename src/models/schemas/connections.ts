import { pgTable, text, uuid, pgEnum, unique } from "drizzle-orm/pg-core";
import { User } from "./user";
import { timestamps } from "./common";

export const softwareType = pgEnum("software_type", ["QuickBooks", "Xero"]);

export const Softwares = pgTable(
  "softwares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    software_type: softwareType().notNull(),
    user_id: uuid("user_id")
      .references(() => User.id)
      .notNull(),
    connection_data: text("connection_data").notNull(),
    ...timestamps,
  },
  (table) => [unique("user_software").on(table.user_id, table.software_type)],
);
