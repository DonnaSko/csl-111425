# Check Runtime Logs for Errors

## What to Look For in Runtime Logs

In the Runtime Logs, look for:

1. **Error messages** - Red text or lines with "Error:"
2. **Recent entries** - Scroll to the bottom (most recent)
3. **Registration errors** - Look for lines mentioning "Registration error" or "Prisma"
4. **Database errors** - Look for "table does not exist" or "P2021" errors

## Common Errors You Might See

### Database Table Error (What We're Looking For):
```
The table `csl.User` does not exist
code: 'P2021'
```

### Other Common Errors:
- Database connection errors
- Missing environment variables
- Prisma errors

## Also Check: Deployment Status

Even though you see Runtime Logs, check if the deployment actually succeeded:

1. Go to **Activity** or **Deployments** tab
2. Look at the most recent deployment
3. Does it say:
   - ✅ **"Live"** or **"Success"** = Deployment worked!
   - ❌ **"Failed"** = Deployment failed (but you'd see Build Logs)
   - 🔄 **"Building"** or **"Deploying"** = Still in progress

## What Do You See?

In the Runtime Logs:
- What's the most recent error message?
- Do you see "table does not exist" errors?
- What's the last line in the logs?

Share what you see and I'll help fix it!

