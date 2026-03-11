# Free Sports & Odds APIs for Betting Management

## 🏆 Recommended Free APIs

### 1. **The Odds API** (Best for Odds)
- **URL**: https://the-odds-api.com/
- **Free Tier**: 500 requests/month
- **Features**: 
  - Live odds from 40+ bookmakers
  - Multiple sports (NFL, NBA, Soccer, etc.)
  - Historical odds data
- **Perfect for**: Odds comparison, arbitrage detection
- **Sign up**: https://the-odds-api.com/account/

### 2. **API-Football** (Best for Soccer)
- **URL**: https://www.api-football.com/
- **Free Tier**: 100 requests/day
- **Features**:
  - Live scores
  - Team statistics
  - Player data
  - Fixtures and results
- **Perfect for**: Soccer bet tracking and analysis

### 3. **API-Sports** (Multi-Sport)
- **URL**: https://api-sports.io/
- **Free Tier**: 100 requests/day per sport
- **Sports**: Football, Basketball, Baseball, Hockey, etc.
- **Features**: Live scores, standings, statistics

### 4. **SportsData.io**
- **URL**: https://sportsdata.io/
- **Free Tier**: Limited (trial)
- **Features**: Comprehensive sports data
- **Good for**: Advanced statistics

## 💡 How to Use in Your Project

### Step 1: Sign Up for The Odds API
1. Go to https://the-odds-api.com/
2. Create free account
3. Get your API key
4. Add to `.env`:
```env
ODDS_API_KEY=your_api_key_here
```

### Step 2: Example Usage

```python
# In your FastAPI app
import httpx

async def get_live_odds(sport='soccer'):
    api_key = settings.odds_api_key
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds"
    
    params = {
        'apiKey': api_key,
        'regions': 'us,uk',
        'markets': 'h2h',  # Head to head
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        return response.json()
```

## 🆓 Completely Free Alternatives

### 1. **ESPN API** (Unofficial)
- No API key needed
- Limited but free
- Good for basic scores

### 2. **TheSportsDB**
- **URL**: https://www.thesportsdb.com/
- **Free Tier**: 1 request/2 seconds
- **Features**: Team info, player data, past results

### 3. **OpenLigaDB** (German Sports)
- Completely free
- No API key needed
- German football leagues

## 📊 What Each API is Good For

| API | Best For | Free Limit | Requires Key |
|-----|----------|------------|--------------|
| The Odds API | Live odds, arbitrage | 500/month | Yes |
| API-Football | Soccer stats | 100/day | Yes |
| API-Sports | Multi-sport data | 100/day | Yes |
| TheSportsDB | Basic team/player info | Unlimited (slow) | Optional |

## 🎯 Recommended Setup for Your App

**For MVP (Free):**
1. **The Odds API** - 500 requests/month for odds comparison
2. **TheSportsDB** - Free team/player info
3. **Manual entry** - Users enter their own bets

**For Production:**
- Upgrade The Odds API ($10-50/month)
- Add API-Football for detailed stats
- Implement caching to reduce API calls

## 🔧 Implementation Tips

1. **Cache aggressively** - Store odds for 5-10 minutes
2. **Use webhooks** - Some APIs offer webhooks instead of polling
3. **Combine APIs** - Use free tier from multiple APIs
4. **Rate limiting** - Implement request queuing

## 📝 Next Steps

1. Sign up for The Odds API (free)
2. Add API key to your `.env` file
3. Test with the example code above
4. Build odds comparison feature!

**Note**: Most free tiers are perfect for development and testing. For production with many users, you'll need paid plans.
