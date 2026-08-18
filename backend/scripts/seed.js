import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB, closeDB } from '../src/config/db.js';
import { seedDemoData } from '../src/services/seedService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const main = async () => {
  const { isInMemory: memory } = await connectDB();
  const result = await seedDemoData();
  console.log('Seeded:');
  console.log(`  Users : admin@arenax.app / Admin@12345, coach@arenax.app / Coach@12345, member@arenax.app / Member@12345`);
  console.log(`  Gyms  : ${result.gyms} Algerian gyms`);
  console.log(`  Events: ${result.events} tournaments`);
  console.log(`  News  : ${result.news} AI news articles`);
  if (memory) {
    console.log('  NOTE  : In-memory database - data is temporary and resets on restart.');
  }
  await mongoose.disconnect();
  process.exit(0);
};

main().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await closeDB().catch(() => {});
  process.exit(1);
});