# AI & Mobile Features Setup Guide

## 🤖 Groq AI Setup (FREE)

### 1. Get Your Free API Key

1. Visit https://console.groq.com/
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key
5. Copy your API key

**Free Tier:**
- 14,400 requests/day
- 30 requests/minute
- Perfect for personal use!

### 2. Add to Environment

Edit `.env.local`:
```env
GROQ_API_KEY=gsk_your_api_key_here
```

### 3. Test the AI

1. Run the app: `npm run dev`
2. Click the AI chat button (bottom-right)
3. Ask: "What's my best performing bet type?"

## 📱 Mobile Features

### What's New

**Mobile Bottom Navigation:**
- Sticky bottom nav bar on mobile
- Smooth animations
- Touch-optimized (44px tap targets)
- Auto-hides on desktop

**AI Chat Widget:**
- Floating chat button
- Mobile-optimized chat interface
- Quick question buttons
- Context-aware responses

### Mobile Testing

**On Your Phone:**
1. Make sure your phone and computer are on the same network
2. Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac)
3. Visit `http://YOUR_IP:3000` on your phone

**Or use Chrome DevTools:**
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select mobile device

## 🎯 AI Features

### What the AI Can Do

**Analyze Your Betting:**
- "What's my win rate on single bets?"
- "Show me my best performing bookie"
- "Why am I losing money?"

**Get Recommendations:**
- "Should I increase my stakes?"
- "What's my optimal bet size?"
- "Analyze my recent losses"

**Pattern Detection:**
- Identifies winning/losing patterns
- Warns about risky behavior
- Suggests improvements

### Quick Questions

The AI comes with pre-built questions:
- "What's my best performing bet type?"
- "Should I increase my stakes?"
- "Analyze my recent losses"
- "What's my optimal stake size?"

## 🚀 Quick Start

```bash
# Install dependencies (if not already)
npm install

# Add Groq API key to .env.local
echo "GROQ_API_KEY=your_key" >> .env.local

# Run the app
npm run dev
```

Visit http://localhost:3000 and click the AI chat button!

## 📊 Mobile Optimizations

**Responsive Design:**
- Bottom navigation on mobile (< 768px)
- Sidebar on desktop (>= 768px)
- Touch-friendly buttons (min 44px)
- Optimized spacing for thumbs

**Performance:**
- Lazy loading components
- Optimized animations
- Smooth 60fps scrolling

## 🎨 Customization

### Change AI Model

Edit `app/api/ai/chat/route.ts`:
```typescript
model: "llama-3.3-70b-versatile", // Best for analysis
// or
model: "llama-3.1-8b-instant",    // Fastest
```

### Customize Quick Questions

Edit `components/ai/AIChatWidget.tsx`:
```typescript
const quickQuestions = [
  "Your custom question 1",
  "Your custom question 2",
];
```

## 🐛 Troubleshooting

**AI not responding:**
- Check GROQ_API_KEY in `.env.local`
- Verify API key is valid at https://console.groq.com/
- Check browser console for errors

**Mobile nav not showing:**
- Only visible on screens < 768px wide
- Use Chrome DevTools mobile view to test

**Chat button overlapping:**
- Adjust position in `AIChatWidget.tsx`
- Change `bottom-6 right-6` values

## 💡 Tips

1. **Ask specific questions** - "What's my ROI on Arsenal bets?" vs "How am I doing?"
2. **Use quick questions** - Tap pre-built questions for instant insights
3. **Mobile testing** - Test on real devices for best results
4. **API limits** - Free tier = 14,400 requests/day (plenty!)

## 🎉 You're All Set!

Your betting app now has:
- ✅ AI-powered insights
- ✅ Mobile-optimized UI
- ✅ Smart recommendations
- ✅ Pattern detection

Enjoy! 🚀
