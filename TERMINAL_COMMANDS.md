# Terminal Commands Reference

This document contains common terminal commands you'll need for setting up and running the Capture Show Leads application.

## Checking if Node.js is Installed

### Check Node.js Version
```bash
node --version
```
or
```bash
node -v
```

**What you should see:**
- If installed: `v18.17.0` or similar (version 18 or higher is required)
- If not installed: `command not found: node` or similar error

### Check npm Version (Node Package Manager)
```bash
npm --version
```
or
```bash
npm -v
```

**What you should see:**
- If installed: `9.6.7` or similar version number
- npm comes with Node.js, so if Node.js is installed, npm should be too

## Installing Node.js (if not installed)

### Option 1: Download from Website (Easiest)
1. Go to https://nodejs.org
2. Download the LTS (Long Term Support) version
3. Run the installer
4. Follow the installation wizard
5. Restart your terminal
6. Verify installation with `node -v`

### Option 2: Using Homebrew (Mac only)
```bash
brew install node
```

### Option 3: Using Package Manager (Linux)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# Fedora
sudo dnf install nodejs npm
```

## Common Commands for This Project

### Navigate to Project Folder
```bash
cd /Users/donnaskolnick/Desktop/CSL-\ 11-14-25
```

### Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Run Development Servers

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

### Database Commands

**Generate Prisma Client:**
```bash
cd backend
npx prisma generate
```

**Run Database Migrations:**
```bash
cd backend
npx prisma migrate dev
```

**Open Prisma Studio (Database GUI):**
```bash
cd backend
npx prisma studio
```

## Checking Other Tools

### Check if Git is Installed
```bash
git --version
```

### Check if PostgreSQL is Installed (for local development)
```bash
psql --version
```

**Note:** You don't need local PostgreSQL if you're using DigitalOcean Managed Database.

## Troubleshooting

### If Node.js Command Not Found
- Make sure you've installed Node.js
- Restart your terminal after installation
- Check your PATH environment variable

### If npm Command Not Found
- npm should come with Node.js
- Try reinstalling Node.js
- Make sure you installed the full Node.js package, not just node

### Permission Errors
If you get permission errors when installing packages:
```bash
# Don't use sudo with npm install (can cause issues)
# Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
```

Then add to your `~/.zshrc` or `~/.bash_profile`:
```bash
export PATH=~/.npm-global/bin:$PATH
```

## Quick Reference

| Command | What It Does |
|---------|-------------|
| `node -v` | Check Node.js version |
| `npm -v` | Check npm version |
| `cd folder` | Change directory |
| `ls` | List files in current directory |
| `pwd` | Show current directory path |
| `npm install` | Install project dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |

## Getting Help

If you're stuck:
1. Check the error message carefully
2. Search for the error online
3. Ask your developer for help
4. Check the project documentation files

