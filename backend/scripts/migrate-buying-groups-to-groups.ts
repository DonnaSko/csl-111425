/**
 * Migration script to migrate existing buyingGroup values to Groups
 * 
 * This script:
 * 1. Creates Groups from unique buyingGroup values
 * 2. Assigns dealers to the appropriate Groups
 * 3. Preserves the buyingGroup field for backward compatibility
 * 
 * Run this script after deploying the new schema:
 * npx ts-node scripts/migrate-buying-groups-to-groups.ts
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function migrateBuyingGroupsToGroups() {
  console.log('Starting migration of buyingGroup values to Groups...');

  try {
    // Get all companies
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Found ${companies.length} companies`);

    for (const company of companies) {
      console.log(`\nProcessing company: ${company.name} (${company.id})`);

      // Get all unique buyingGroup values for this company
      const dealersWithBuyingGroups = await prisma.dealer.findMany({
        where: {
          companyId: company.id,
          buyingGroup: { not: null }
        },
        select: {
          id: true,
          buyingGroup: true
        },
        distinct: ['buyingGroup']
      });

      const uniqueBuyingGroups = dealersWithBuyingGroups
        .map(d => d.buyingGroup)
        .filter((bg): bg is string => bg !== null && bg.trim() !== '');

      console.log(`  Found ${uniqueBuyingGroups.length} unique buying groups`);

      if (uniqueBuyingGroups.length === 0) {
        console.log(`  No buying groups to migrate for this company`);
        continue;
      }

      // Create Groups for each unique buyingGroup
      const createdGroups: { [key: string]: string } = {};
      
      for (const buyingGroupName of uniqueBuyingGroups) {
        if (!buyingGroupName) continue;

        const trimmedName = buyingGroupName.trim();
        
        // Check if group already exists
        const existingGroup = await prisma.group.findFirst({
          where: {
            companyId: company.id,
            name: trimmedName
          }
        });

        if (existingGroup) {
          console.log(`  Group "${trimmedName}" already exists, skipping creation`);
          createdGroups[trimmedName] = existingGroup.id;
        } else {
          // Create the group
          const group = await prisma.group.create({
            data: {
              companyId: company.id,
              name: trimmedName
            }
          });
          console.log(`  Created group: "${trimmedName}" (${group.id})`);
          createdGroups[trimmedName] = group.id;
        }
      }

      // Now assign dealers to groups
      const allDealers = await prisma.dealer.findMany({
        where: {
          companyId: company.id,
          buyingGroup: { not: null }
        },
        select: {
          id: true,
          buyingGroup: true
        }
      });

      console.log(`  Assigning ${allDealers.length} dealers to groups...`);

      let assignedCount = 0;
      let skippedCount = 0;

      for (const dealer of allDealers) {
        if (!dealer.buyingGroup) continue;

        const trimmedName = dealer.buyingGroup.trim();
        const groupId = createdGroups[trimmedName];

        if (!groupId) {
          console.warn(`  Warning: No group found for buyingGroup "${trimmedName}"`);
          skippedCount++;
          continue;
        }

        // Check if relationship already exists
        const existingRelation = await prisma.dealerGroup.findUnique({
          where: {
            dealerId_groupId: {
              dealerId: dealer.id,
              groupId: groupId
            }
          }
        });

        if (existingRelation) {
          skippedCount++;
          continue;
        }

        // Create the relationship
        await prisma.dealerGroup.create({
          data: {
            dealerId: dealer.id,
            groupId: groupId
          }
        });

        assignedCount++;
      }

      console.log(`  Assigned ${assignedCount} dealers to groups (${skippedCount} already assigned)`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNote: The buyingGroup field has been preserved for backward compatibility.');
    console.log('Existing buyingGroup values have been migrated to Groups.');
    console.log('Users can now use the Groups feature while still seeing buyingGroup values.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateBuyingGroupsToGroups()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });




