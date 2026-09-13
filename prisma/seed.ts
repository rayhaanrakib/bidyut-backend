import { seed } from '../src/app/utils/seed';
console.log('Seeding database...');
await seed();
console.log('Database seeding completed.');
