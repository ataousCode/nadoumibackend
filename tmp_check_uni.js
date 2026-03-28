import prisma from "./config/prisma.js";

async function check() {
  const uni = await prisma.university.findUnique({
    where: { id: "bb2f1ea2-f82b-4960-b0ee-f47c5c3b07ea" }
  });
  console.log("University exists:", !!uni);
  process.exit(0);
}

check();
