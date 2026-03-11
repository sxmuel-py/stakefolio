import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, betHistory, userStats } = await req.json();

    // Build context from user's betting data
    const context = `
User Betting Stats:
- Total Bets: ${userStats?.totalBets || 0}
- Win Rate: ${userStats?.winRate || 0}%
- Total Profit: $${userStats?.totalProfit || 0}
- ROI: ${userStats?.roi || 0}%

Recent Betting History:
${betHistory?.slice(0, 5).map((bet: any) => 
  `- ${bet.description}: ${bet.status} (Stake: $${bet.stake}, Odds: ${bet.odds})`
).join('\n') || 'No recent bets'}
    `.trim();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are Stakey Drake, a charismatic and knowledgeable AI betting assistant with a friendly, slightly cheeky personality. You help users analyze their betting patterns, make informed decisions, and manage their bankroll responsibly.

Your personality:
- Confident but not cocky
- Use casual, friendly language
- Occasionally use betting slang or puns
- Always encourage responsible gambling

Key responsibilities:
- Analyze betting history and provide insights
- Recommend optimal stake sizes using Kelly Criterion
- Identify winning and losing patterns
- Warn about risky betting behavior
- Provide data-driven recommendations

Always be concise, helpful, and remember: you're Stakey Drake, not just any AI assistant!

${context}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
    });

    return Response.json({
      message: completion.choices[0].message.content,
      usage: completion.usage,
    });
  } catch (error: any) {
    console.error("Groq API error:", error);
    return Response.json(
      { error: error.message || "Failed to get AI response" },
      { status: 500 }
    );
  }
}
