import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("fondateur", 12);

  for (const email of ["baptiste@evo-incubateur.fr", "talel@evo-incubateur.fr"]) {
    await prisma.adminUser.upsert({
      where: { email },
      update: {},
      create: { email, password: hashedPassword },
    });
  }

  console.log("Admin users created: baptiste@evo-incubateur.fr, talel@evo-incubateur.fr");

  const offers = ["AGORA", "NEXUS", "ATLAS"];
  for (const offer of offers) {
    const existing = await prisma.config.findFirst({ where: { offer } });
    if (!existing) {
      await prisma.config.create({
        data: {
          offer,
          calComUrl: "https://calendly.com/hogbat08/evo-onboarding",
          slackInviteUrl:
            "https://join.slack.com/t/evo-incubator/shared_invite/zt-3tp5dgmxv-GC88JtMwto5br0n8tX87pg",
        },
      });
    }
  }

  const globalConfig = await prisma.config.findFirst({
    where: { offer: null },
  });
  if (!globalConfig) {
    await prisma.config.create({
      data: {
        offer: null,
        nexusAmount: 5000,
        slackInviteUrl:
          "https://join.slack.com/t/evo-incubator/shared_invite/zt-3tp5dgmxv-GC88JtMwto5br0n8tX87pg",
      },
    });
  }

  console.log("Default configs created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
