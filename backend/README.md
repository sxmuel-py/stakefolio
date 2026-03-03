# Betting Management System - Backend

Professional betting management system backend built with Go and Gin framework.

## Features

- JWT-based authentication
- Bookie management
- Bet tracking with automatic P&L calculation
- Bankroll management with transaction history
- Comprehensive statistics and analytics

## Setup

1. Install PostgreSQL and create a database:
```bash
createdb betting_management
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Install dependencies:
```bash
go mod download
```

4. Run the server:
```bash
go run main.go
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/me` - Get current user (protected)

### Bookies
- `POST /api/bookies` - Create bookie
- `GET /api/bookies` - List all bookies
- `GET /api/bookies/:id` - Get bookie details
- `PUT /api/bookies/:id` - Update bookie
- `DELETE /api/bookies/:id` - Delete bookie

### Bets
- `POST /api/bets` - Create bet
- `GET /api/bets` - List bets (with filters)
- `GET /api/bets/stats` - Get betting statistics
- `GET /api/bets/:id` - Get bet details
- `PATCH /api/bets/:id/status` - Update bet status

### Bankroll
- `POST /api/bankroll/deposit` - Deposit funds
- `POST /api/bankroll/withdraw` - Withdraw funds
- `GET /api/bankroll/transactions` - Get transaction history
- `GET /api/bankroll/summary` - Get bankroll summary

## Database Schema

- **users** - User accounts
- **bookies** - Betting platforms
- **bets** - Individual bets with P&L tracking
- **bankroll_transactions** - Financial transaction history
