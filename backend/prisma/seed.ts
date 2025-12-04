
// @ts-ignore
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('>>> SEED: STARTING...');

  try {
    const MONTHLY_ALLOWANCE_SECONDS = 70 * 3600; 
    const USED_SECONDS = 0;

    console.log('>>> SEED: Hashing passwords...');
    const adminPass = await bcrypt.hash('scriba_admin_pass', 10);
    const companyAdminPass = await bcrypt.hash('pinco_admin_pass', 10);
    const userPass = await bcrypt.hash('user_pass_123', 10);

    console.log('>>> SEED: Creating Pincopallo Company...');
    const company = await prisma.company.upsert({
      where: { id: 'company-1' },
      update: {},
      create: {
        id: 'company-1',
        name: 'Pincopallo SPA',
        logoUrl: 'https://placehold.co/200x200/007bff/FFFFFF/png?text=PS',
      },
    });
    console.log(`Company ensured: ${company.name}`);

    console.log('>>> SEED: Creating General Admin...');
    await prisma.user.upsert({
      where: { email: 'admin@aiscriba.com' },
      update: { password: adminPass, role: 'GeneralAdmin' },
      create: {
        email: 'admin@aiscriba.com',
        password: adminPass,
        role: 'GeneralAdmin',
        monthlyAllowanceSeconds: MONTHLY_ALLOWANCE_SECONDS,
        usedSecondsThisMonth: USED_SECONDS,
      },
    });
    console.log(`General admin ensured: admin@aiscriba.com`);

    console.log('>>> SEED: Creating Pincopallo Users...');
    await prisma.user.upsert({
      where: { email: 'admin@pincopallo.com' },
      update: { password: companyAdminPass, role: 'CompanyAdmin', companyId: company.id },
      create: {
        email: 'admin@pincopallo.com',
        password: companyAdminPass,
        role: 'CompanyAdmin',
        companyId: company.id,
        monthlyAllowanceSeconds: MONTHLY_ALLOWANCE_SECONDS,
        usedSecondsThisMonth: USED_SECONDS,
      },
    });

    await prisma.user.upsert({
      where: { email: 'mario.rossi@pincopallo.com' },
      update: { password: userPass, role: 'User', companyId: company.id },
      create: {
        email: 'mario.rossi@pincopallo.com',
        password: userPass,
        role: 'User',
        companyId: company.id,
        monthlyAllowanceSeconds: MONTHLY_ALLOWANCE_SECONDS,
        usedSecondsThisMonth: USED_SECONDS,
      },
    });
    console.log(`Pincopallo users ensured.`);

    console.log('>>> SEED: SUCCESS! Database populated.');
  } catch (e) {
    console.error('>>> SEED: FATAL ERROR:', e);
    // @ts-ignore
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
