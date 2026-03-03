# BetManager Pro - Professional Betting Management System

A high-tech, professional betting management system with a Go backend and Next.js frontend featuring an iOS-inspired UI with glassmorphism effects and smooth animations.

![BetManager Pro](https://img.shields.io/badge/Status-Ready-success)
![Go](https://img.shields.io/badge/Go-1.21-00ADD8?logo=go)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## ✨ Features

### 🎯 Core Functionality
- **Bookie Management** - Add, edit, and track multiple betting platforms
- **Bet Tracking** - Record bets with automatic P&L calculation
- **Bankroll Management** - Comprehensive deposit/withdrawal tracking
- **Real-time Analytics** - ROI, win rate, and profit/loss statistics
- **Transaction History** - Complete audit trail of all financial activities

### 🎨 Premium UI/UX
- **iOS-Inspired Design** - Modern, sleek interface with glassmorphism
- **Smooth Animations** - Framer Motion powered micro-interactions
- **Responsive Layout** - Perfect on desktop, tablet, and mobile
- **Dark Mode Support** - Automatic theme detection
- **Color-Coded Indicators** - Visual profit/loss tracking

## 🚀 Quick Start

### Prerequisites
- Go 1.21 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd betting-management/backend
```

2. **Create PostgreSQL database:**
```bash
createdb betting_management
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Install dependencies:**
```bash
go mod download
```

5. **Run the server:**
```bash
go run main.go
```

The API will be available at `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd betting-management/frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment:**
```bash
cp .env.local.example .env.local
```

4. **Run the development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
betting-management/
├── backend/
│   ├── config/          # Configuration management
│   ├── controllers/     # API controllers
│   ├── database/        # Database connection
│   ├── middleware/      # JWT authentication
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   └── main.go          # Entry point
│
└── frontend/
    ├── app/             # Next.js pages
    │   ├── dashboard/   # Main dashboard
    │   ├── bookies/     # Bookie management
    │   ├── bets/        # Bet tracking
    │   ├── bankroll/    # Bankroll management
    │   └── login/       # Authentication
    ├── components/      # React components
    │   ├── ui/          # Base UI components
    │   ├── bookies/     # Bookie components
    │   ├── bets/        # Bet components
    │   ├── bankroll/    # Bankroll components
    │   └── layout/      # Layout components
    ├── lib/             # Utilities & API client
    └── types/           # TypeScript definitions
```

## 🎨 Design System

### Colors
- **Primary**: Blue gradient (#3B82F6 → #2563EB)
- **Success**: Green (#22C55E)
- **Danger**: Red (#EF4444)
- **Warning**: Orange (#F59E0B)

### Effects
- **Glassmorphism**: Frosted glass effect with backdrop blur
- **iOS Shadows**: Soft, layered shadows
- **Smooth Transitions**: 200ms cubic-bezier animations
- **Micro-interactions**: Haptic-style button presses

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/me` - Get current user

### Bookies
- `GET /api/bookies` - List all bookies
- `POST /api/bookies` - Create bookie
- `GET /api/bookies/:id` - Get bookie details
- `PUT /api/bookies/:id` - Update bookie
- `DELETE /api/bookies/:id` - Delete bookie

### Bets
- `GET /api/bets` - List bets (with filters)
- `POST /api/bets` - Create bet
- `GET /api/bets/stats` - Get betting statistics
- `GET /api/bets/:id` - Get bet details
- `PATCH /api/bets/:id/status` - Update bet status

### Bankroll
- `POST /api/bankroll/deposit` - Deposit funds
- `POST /api/bankroll/withdraw` - Withdraw funds
- `GET /api/bankroll/transactions` - Get transaction history
- `GET /api/bankroll/summary` - Get bankroll summary

## 🛠️ Tech Stack

### Backend
- **Go** - High-performance backend
- **Gin** - Web framework
- **GORM** - ORM for PostgreSQL
- **JWT** - Authentication
- **PostgreSQL** - Database

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **React Query** - Data fetching
- **Axios** - HTTP client
- **Zustand** - State management
- **React Hot Toast** - Notifications

## 📊 Database Schema

### Users
- Authentication and profile information

### Bookies
- Betting platform details and balances

### Bets
- Individual bet records with P&L tracking

### Bankroll Transactions
- Complete financial transaction history

## 🎯 Key Features Explained

### Automatic P&L Calculation
When you mark a bet as won or lost, the system automatically:
- Calculates profit/loss
- Updates bookie balance
- Creates transaction records
- Updates statistics

### Bankroll Management
- Track deposits and withdrawals per bookie
- View complete transaction history
- Monitor ROI across all platforms
- See total balance at a glance

### Real-time Statistics
- Win rate percentage
- Total profit/loss
- ROI calculation
- Active bets tracking

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- CORS configuration
- SQL injection prevention (GORM)

## 📱 Responsive Design

The app is fully responsive and optimized for:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎨 Customization

### Adding Custom Colors
Edit `tailwind.config.ts` to add your own color schemes.

### Modifying Animations
Adjust animation timings in `globals.css` and Framer Motion configs.

### Changing Currency
Update the `formatCurrency` function in `lib/utils.ts`.

## 🐛 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure port 8080 is available

### Frontend won't start
- Run `npm install` to ensure all dependencies are installed
- Check `.env.local` has correct API URL
- Ensure port 3000 is available

### CORS errors
- Verify backend CORS configuration includes frontend URL
- Check API URL in frontend `.env.local`

## 📝 License

This project is private and proprietary.

## 🤝 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ using Go and Next.js**
