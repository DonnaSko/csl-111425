# Capture Show Leads

A comprehensive trade show lead management application with secure payment processing and dealer management.

## Features

- 🔐 Secure authentication and data isolation
- 💳 Stripe payment integration (Monthly $99 or Annual $920)
- 👥 Dealer/Lead management
- 📷 Badge scanning with OCR
- 📝 Notes and voice recordings
- 📊 Reports and analytics
- 📁 CSV import/export
- ✅ To-do management
- 🎯 Lead quality ratings

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Prisma
- **Database**: PostgreSQL
- **Payments**: Stripe
- **OCR**: Tesseract.js

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Set up environment variables (see `.env.example`)
4. Run database migrations:
   ```bash
   cd backend && npx prisma migrate dev
   ```

5. Start development servers:
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend (in another terminal)
   cd frontend && npm run dev
   ```

## Environment Variables

See `.env.example` files in both `backend/` and `frontend/` directories.

## License

Proprietary

