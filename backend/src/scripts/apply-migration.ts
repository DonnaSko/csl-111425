import prisma from '../utils/prisma';

async function applyMigration() {
  console.log('🔄 Applying database migration...');
  console.log('📝 Adding content column to EmailFile table...');
  
  try {
    // Add content column
    await prisma.$executeRaw`
      ALTER TABLE "csl"."EmailFile" 
      ADD COLUMN IF NOT EXISTS "content" BYTEA;
    `;
    console.log('✅ Added content column');
    
    // Make path nullable
    await prisma.$executeRaw`
      ALTER TABLE "csl"."EmailFile" 
      ALTER COLUMN "path" DROP NOT NULL;
    `;
    console.log('✅ Made path column nullable');
    
    console.log('🎉 Migration applied successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Delete old email files in the app');
    console.log('2. Upload new files (they will be stored in database)');
    console.log('3. Test sending email with attachments');
    
  } catch (error: any) {
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('ℹ️  Migration already applied (content column exists)');
    } else {
      console.error('❌ Error applying migration:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

