#!/usr/bin/env ts-node

import prisma from '../utils/prisma';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper to format dates
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Block a user by email (revoke access)
async function blockUser(email: string) {
  console.log(`${colors.yellow}⏳ Looking for user: ${email}${colors.reset}`);
  
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { 
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });
  
  if (!user) {
    console.log(`${colors.red}❌ User not found: ${email}${colors.reset}`);
    return;
  }

  const subscription = user.subscriptions[0];
  
  if (!subscription) {
    console.log(`${colors.yellow}⚠️  User has no subscription to block${colors.reset}`);
    return;
  }

  // Set subscription to expired/canceled
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'canceled',
      currentPeriodEnd: new Date('2000-01-01'), // Past date
      canceledAt: new Date(),
      cancelAtPeriodEnd: false
    }
  });

  console.log(`${colors.green}✅ User blocked: ${email}${colors.reset}`);
  console.log(`   Name: ${user.firstName} ${user.lastName}`);
  console.log(`   Previous status: ${subscription.status}`);
  console.log(`   New status: canceled (expired)`);
  console.log(`   ${colors.red}User can no longer access the app${colors.reset}`);
}

// Unblock a user by email (restore access)
async function unblockUser(email: string) {
  console.log(`${colors.yellow}⏳ Looking for user: ${email}${colors.reset}`);
  
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { 
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });
  
  if (!user) {
    console.log(`${colors.red}❌ User not found: ${email}${colors.reset}`);
    return;
  }

  const subscription = user.subscriptions[0];
  
  if (!subscription) {
    console.log(`${colors.yellow}⚠️  User has no subscription to restore${colors.reset}`);
    console.log(`   Create a subscription via Stripe instead.`);
    return;
  }

  // Restore subscription (extend by 30 days)
  const newEndDate = new Date();
  newEndDate.setDate(newEndDate.getDate() + 30);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'active',
      currentPeriodEnd: newEndDate,
      canceledAt: null,
      cancelAtPeriodEnd: false
    }
  });

  console.log(`${colors.green}✅ User unblocked: ${email}${colors.reset}`);
  console.log(`   Name: ${user.firstName} ${user.lastName}`);
  console.log(`   Status: active`);
  console.log(`   Access until: ${formatDate(newEndDate)}`);
  console.log(`   ${colors.green}User can now access the app${colors.reset}`);
}

// Delete a user and all their data
async function deleteUser(email: string) {
  console.log(`${colors.yellow}⏳ Looking for user: ${email}${colors.reset}`);
  
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { 
      company: true,
      subscriptions: true
    }
  });
  
  if (!user) {
    console.log(`${colors.red}❌ User not found: ${email}${colors.reset}`);
    return;
  }

  // Check if other users in same company
  const companyUsers = await prisma.user.count({
    where: { companyId: user.companyId }
  });

  // Count their data
  const dealerCount = await prisma.dealer.count({ where: { companyId: user.companyId } });
  const tradeShowCount = await prisma.tradeShow.count({ where: { companyId: user.companyId } });
  const todoCount = await prisma.todo.count({ where: { companyId: user.companyId } });

  console.log(`\n${colors.red}⚠️  WARNING: You are about to PERMANENTLY DELETE:${colors.reset}`);
  console.log(`   📧 User: ${user.email}`);
  console.log(`   👤 Name: ${user.firstName} ${user.lastName}`);
  console.log(`   🏢 Company: ${user.company.name}`);
  console.log(`   📊 ${dealerCount} dealers`);
  console.log(`   🎪 ${tradeShowCount} trade shows`);
  console.log(`   ✅ ${todoCount} todos`);
  console.log(`   💳 ${user.subscriptions.length} subscription(s)`);
  
  if (companyUsers === 1) {
    console.log(`   ${colors.red}🏢 The company "${user.company.name}" will also be deleted (no other users)${colors.reset}`);
  } else {
    console.log(`   ℹ️  Company has ${companyUsers - 1} other user(s) who will NOT be deleted`);
  }

  console.log(`\n${colors.yellow}⏳ Waiting 5 seconds... Press Ctrl+C to cancel${colors.reset}\n`);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Delete user (cascade will delete all related data)
  await prisma.user.delete({ where: { id: user.id } });

  console.log(`${colors.green}✅ User deleted: ${email}${colors.reset}`);
  
  if (companyUsers === 1) {
    console.log(`${colors.yellow}⚠️  Company "${user.company.name}" was also deleted${colors.reset}`);
  }
}

// List all users
async function listUsers() {
  const users = await prisma.user.findMany({
    include: {
      subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
      company: true
    },
    orderBy: { createdAt: 'desc' }
  });

  if (users.length === 0) {
    console.log(`${colors.yellow}No users found in database${colors.reset}`);
    return;
  }

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}📋 ALL USERS (${users.length} total)${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  for (const user of users) {
    const sub = user.subscriptions[0];
    const hasActiveSub = sub && sub.status === 'active' && sub.currentPeriodEnd >= new Date();
    const statusColor = hasActiveSub ? colors.green : colors.red;
    const statusIcon = hasActiveSub ? '✅' : '❌';
    
    console.log(`📧 ${colors.blue}${user.email}${colors.reset}`);
    console.log(`   👤 Name: ${user.firstName} ${user.lastName}`);
    console.log(`   🏢 Company: ${user.company.name}`);
    
    if (sub) {
      console.log(`   ${statusIcon} Status: ${statusColor}${sub.status}${colors.reset}`);
      console.log(`   📅 Expires: ${formatDate(sub.currentPeriodEnd)}`);
      if (sub.cancelAtPeriodEnd) {
        console.log(`   ⚠️  Set to cancel at period end`);
      }
      if (sub.canceledAt) {
        console.log(`   🚫 Canceled: ${formatDate(sub.canceledAt)}`);
      }
    } else {
      console.log(`   ❌ Status: ${colors.red}No subscription${colors.reset}`);
    }
    
    console.log(`   🆔 User ID: ${user.id}`);
    console.log(`   📅 Joined: ${formatDate(user.createdAt)}`);
    console.log('');
  }
}

// Get user details
async function getUserDetails(email: string) {
  console.log(`${colors.yellow}⏳ Looking for user: ${email}${colors.reset}\n`);
  
  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { 
      company: true,
      subscriptions: { orderBy: { createdAt: 'desc' } }
    }
  });
  
  if (!user) {
    console.log(`${colors.red}❌ User not found: ${email}${colors.reset}`);
    return;
  }

  // Count their data
  const dealerCount = await prisma.dealer.count({ where: { companyId: user.companyId } });
  const tradeShowCount = await prisma.tradeShow.count({ where: { companyId: user.companyId } });
  const todoCount = await prisma.todo.count({ where: { companyId: user.companyId } });
  const companyUsers = await prisma.user.count({ where: { companyId: user.companyId } });

  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}👤 USER DETAILS${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  console.log(`📧 Email: ${colors.blue}${user.email}${colors.reset}`);
  console.log(`👤 Name: ${user.firstName} ${user.lastName}`);
  console.log(`🆔 User ID: ${user.id}`);
  console.log(`📅 Joined: ${formatDate(user.createdAt)}`);
  console.log(`📅 Last Updated: ${formatDate(user.updatedAt)}`);
  
  console.log(`\n${colors.cyan}🏢 COMPANY${colors.reset}`);
  console.log(`   Name: ${user.company.name}`);
  console.log(`   ID: ${user.company.id}`);
  console.log(`   Users: ${companyUsers}`);
  
  console.log(`\n${colors.cyan}📊 DATA${colors.reset}`);
  console.log(`   Dealers: ${dealerCount}`);
  console.log(`   Trade Shows: ${tradeShowCount}`);
  console.log(`   Todos: ${todoCount}`);
  
  console.log(`\n${colors.cyan}💳 SUBSCRIPTIONS (${user.subscriptions.length})${colors.reset}`);
  
  if (user.subscriptions.length === 0) {
    console.log(`   ${colors.red}No subscriptions${colors.reset}`);
  } else {
    user.subscriptions.forEach((sub, index) => {
      const isActive = sub.status === 'active' && sub.currentPeriodEnd >= new Date();
      const statusColor = isActive ? colors.green : colors.red;
      const statusIcon = isActive ? '✅' : '❌';
      
      console.log(`\n   ${statusIcon} Subscription #${index + 1}`);
      console.log(`      Status: ${statusColor}${sub.status}${colors.reset}`);
      console.log(`      Stripe ID: ${sub.stripeSubscriptionId}`);
      console.log(`      Price ID: ${sub.stripePriceId}`);
      console.log(`      Period End: ${formatDate(sub.currentPeriodEnd)}`);
      
      if (sub.cancelAtPeriodEnd) {
        console.log(`      ⚠️  Cancel at period end: Yes`);
      }
      if (sub.canceledAt) {
        console.log(`      Canceled: ${formatDate(sub.canceledAt)}`);
      }
      console.log(`      Created: ${formatDate(sub.createdAt)}`);
    });
  }
  
  console.log('');
}

// Show help
function showHelp() {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}👨‍💼 ADMIN USER MANAGEMENT SCRIPT${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  
  console.log(`${colors.yellow}USAGE:${colors.reset}`);
  console.log(`  npm run admin <command> [email]\n`);
  
  console.log(`${colors.yellow}COMMANDS:${colors.reset}\n`);
  
  console.log(`  ${colors.green}list${colors.reset}`);
  console.log(`    List all users and their subscription status`);
  console.log(`    ${colors.cyan}Example: npm run admin list${colors.reset}\n`);
  
  console.log(`  ${colors.green}info <email>${colors.reset}`);
  console.log(`    Get detailed information about a specific user`);
  console.log(`    ${colors.cyan}Example: npm run admin info user@example.com${colors.reset}\n`);
  
  console.log(`  ${colors.green}block <email>${colors.reset}`);
  console.log(`    Block a user (revoke access immediately)`);
  console.log(`    Sets subscription to canceled/expired`);
  console.log(`    ${colors.cyan}Example: npm run admin block baduser@example.com${colors.reset}\n`);
  
  console.log(`  ${colors.green}unblock <email>${colors.reset}`);
  console.log(`    Unblock a user (restore access for 30 days)`);
  console.log(`    Sets subscription to active`);
  console.log(`    ${colors.cyan}Example: npm run admin unblock user@example.com${colors.reset}\n`);
  
  console.log(`  ${colors.green}delete <email>${colors.reset}`);
  console.log(`    ${colors.red}PERMANENTLY DELETE${colors.reset} a user and all their data`);
  console.log(`    ${colors.red}⚠️  WARNING: This cannot be undone!${colors.reset}`);
  console.log(`    ${colors.cyan}Example: npm run admin delete user@example.com${colors.reset}\n`);
  
  console.log(`  ${colors.green}help${colors.reset}`);
  console.log(`    Show this help message`);
  console.log(`    ${colors.cyan}Example: npm run admin help${colors.reset}\n`);
}

// Main function
async function main() {
  const command = process.argv[2];
  const email = process.argv[3];

  try {
    switch (command) {
      case 'list':
        await listUsers();
        break;
        
      case 'info':
        if (!email) {
          console.log(`${colors.red}❌ Error: Email required${colors.reset}`);
          console.log(`Usage: npm run admin info user@example.com`);
          process.exit(1);
        }
        await getUserDetails(email);
        break;
        
      case 'block':
        if (!email) {
          console.log(`${colors.red}❌ Error: Email required${colors.reset}`);
          console.log(`Usage: npm run admin block user@example.com`);
          process.exit(1);
        }
        await blockUser(email);
        break;
        
      case 'unblock':
        if (!email) {
          console.log(`${colors.red}❌ Error: Email required${colors.reset}`);
          console.log(`Usage: npm run admin unblock user@example.com`);
          process.exit(1);
        }
        await unblockUser(email);
        break;
        
      case 'delete':
        if (!email) {
          console.log(`${colors.red}❌ Error: Email required${colors.reset}`);
          console.log(`Usage: npm run admin delete user@example.com`);
          process.exit(1);
        }
        await deleteUser(email);
        break;
        
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        console.log(`${colors.red}❌ Unknown command: ${command}${colors.reset}\n`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run main function
main().catch((error) => {
  console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error);
  process.exit(1);
});

