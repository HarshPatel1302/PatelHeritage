# Quick Start Guide - Patel Heritage Web Application

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation Steps

1. **Navigate to the web directory**
   ```bash
   cd apps/web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
apps/web/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── wings/             # Wing management pages
│   ├── messages/          # Messaging system
│   ├── entry/             # Entry management
│   ├── shops/             # Shop directory
│   ├── amenities/         # Amenities booking
│   ├── announcements/     # Announcements
│   └── dashboard/         # Main dashboard
├── components/            # React components
│   ├── Navigation.tsx    # Navigation bar
│   ├── WingVisualization.tsx
│   └── FeatureCard.tsx
├── lib/                   # Utilities and constants
│   └── constants.ts      # Society data
├── types/                 # TypeScript types
│   └── index.ts
└── package.json
```

## 🎨 Key Features Overview

### 1. Home Page (`/`)
- Interactive wing visualization
- Feature cards with animations
- Modern UI with glassmorphism effects

### 2. Wings (`/wings`)
- View all 6 wings (A-F)
- Click to see floor details
- Room/flat number display

### 3. Messages (`/messages`)
- Send complaints, suggestions, queries
- Select recipient (Committee, Chairman, Secretary, Treasurer)
- Track message status

### 4. Entry Management (`/entry`)
- Register visitors
- Select gate (Front/Back)
- Vehicle management
- Approval workflow

### 5. Shops (`/shops`)
- Browse shop directory
- Search and filter
- Add new shops
- View shop details

### 6. Amenities (`/amenities`)
- View all amenities
- Book time slots
- Check availability

### 7. Announcements (`/announcements`)
- View society announcements
- Priority-based display
- Category filtering

### 8. Dashboard (`/dashboard`)
- Statistics overview
- Quick actions
- Recent activity

## 🛠️ Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🎯 Next Steps

1. **Backend Integration**
   - Set up API server
   - Database connection
   - Authentication system

2. **Data Persistence**
   - Replace local state with API calls
   - Implement data storage

3. **Authentication**
   - User login/signup
   - Role-based access control
   - Session management

4. **Real-time Features**
   - WebSocket integration
   - Live notifications
   - Real-time updates

5. **Mobile App**
   - React Native setup
   - API integration
   - Push notifications

## 📝 Notes

- All data is currently stored in local state (client-side only)
- No backend is connected yet
- Authentication is not implemented
- Some features are placeholders for future implementation

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### TypeScript errors
```bash
# Check TypeScript version
npx tsc --version
# Should be 5.3.2 or higher
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

**Happy Coding! 🎉**

