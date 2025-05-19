import db from "./models/db";
import { User } from "./models/schemas";

const seedUsers = async () => {
  const users = [
    {
      id: "8f2e4e9b-9c61-45b6-a89b-60f64a1e7f3e",
      name: "John Doe",
    },
  ];
  await db.insert(User).values(users).onConflictDoNothing();
};

const main = async () => {
  await seedUsers();
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
