const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface AIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  
  // If no API key is available, return fallback response immediately
  if (!OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key not found, using fallback responses');
    return getFallbackResponse(prompt);
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'EverBloom - AI Relationship Nurturer',
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.warn(`AI API error: ${response.statusText}, falling back to local responses`);
      return getFallbackResponse(prompt);
    }

    const data: AIResponse = await response.json();
    return data.choices[0]?.message?.content || getFallbackResponse(prompt);
  } catch (error) {
    console.warn('AI API Error, using fallback:', error);
    return getFallbackResponse(prompt);
  }
}

function getFallbackResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('gift') || lowerPrompt.includes('present')) {
    return `Here are some thoughtful gift ideas:

1. **Personalized Photo Album** - Create a collection of your favorite memories together with handwritten notes about each moment.

2. **Experience Gift** - Plan a special outing like a cooking class, nature walk, or visit to a local museum that matches their interests.

3. **Handwritten Letter** - Sometimes the most meaningful gift is expressing your feelings and appreciation in your own words.

Consider their personality and interests when choosing. The thought and care you put into selecting something meaningful matters more than the price tag.`;
  }
  
  if (lowerPrompt.includes('activity') || lowerPrompt.includes('do together')) {
    return `Here are some meaningful activities to enjoy together:

1. **Cook a Meal Together** - Choose a recipe you've both wanted to try and enjoy the process of creating something delicious.

2. **Take a Nature Walk** - Explore a local park or trail while having meaningful conversations away from distractions.

3. **Start a Creative Project** - Work on something together like a puzzle, art project, or even planning a future adventure.

The best activities are ones where you can connect, laugh, and create new memories together.`;
  }
  
  if (lowerPrompt.includes('message') || lowerPrompt.includes('text') || lowerPrompt.includes('communicate')) {
    return `Here's a heartfelt message you could send:

"Hi! I was just thinking about you and wanted to reach out. I really appreciate having you in my life and all the joy you bring to it. I hope you're having a wonderful day, and I'd love to catch up soon. Take care! 💕"

Remember to:
- Be genuine and speak from the heart
- Reference specific memories or qualities you appreciate about them
- Ask questions to show you're interested in their life
- Keep the tone warm and personal`;
  }
  
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('feedback')) {
    return `Here's some feedback on your message:

**Positive aspects:**
- Shows genuine care and interest
- Has a warm, friendly tone
- Invites further conversation

**Suggestions for improvement:**
- Consider adding a specific memory or shared experience
- Ask an open-ended question about their life
- Match the tone to your relationship dynamic

**Overall sentiment:** Your message comes across as caring and thoughtful. The recipient will likely appreciate hearing from you.`;
  }
  
  return `I'd love to help you nurture your relationships! Here are some general suggestions:

💝 **Stay Connected**: Regular check-ins, even brief ones, help maintain strong bonds.

🎁 **Show Appreciation**: Express gratitude for the ways they enrich your life.

👂 **Listen Actively**: Give them your full attention when they share what's important to them.

🌟 **Create Memories**: Plan activities or experiences you can enjoy together.

Remember, the most important thing is being genuine and showing that you care. Small, consistent gestures often mean more than grand gestures.`;
}

export async function generateDailyNudge(userName: string, relationshipName: string, relationshipType: string, preferences: any, lastInteraction: string | null, importantDates: any): Promise<string> {
  const systemPrompt = `You are an empathetic relationship nurturer AI for EverBloom. Generate warm, actionable, and personalized relationship suggestions that help people connect meaningfully with their loved ones. Keep suggestions simple, genuine, and culturally appropriate.`;
  
  const prompt = `Generate a concise, actionable, and personalized suggestion for ${userName} to connect with ${relationshipName} (${relationshipType}). 

Context:
- Preferences: ${JSON.stringify(preferences)}
- Last interaction: ${lastInteraction || 'No recent interactions'}
- Important dates: ${JSON.stringify(importantDates)}

Provide a warm, specific suggestion that takes into account their relationship type and preferences. Keep it under 150 words and make it actionable.`;

  return await callAI(prompt, systemPrompt);
}

export async function generateGiftIdeas(relationshipName: string, relationshipType: string, preferences: any, mood: string, budget: string): Promise<string> {
  const systemPrompt = `You are a creative relationship strategist AI. Generate specific, thoughtful gift ideas that show genuine care and consideration for the person's interests and the relationship dynamic.`;
  
  const prompt = `Generate 3 diverse, specific, and actionable gift ideas for ${relationshipName} (${relationshipType}).

Context:
- Preferences: ${JSON.stringify(preferences)}
- Desired mood: ${mood}
- Budget range: ${budget}

Provide creative, thoughtful gifts that are:
1. Thoughtful and personal
2. Suitable for the relationship type
3. Within the specified budget range

Format as a numbered list with brief explanations.`;

  return await callAI(prompt, systemPrompt);
}

export async function generateActivityIdeas(relationshipName: string, relationshipType: string, preferences: any, mood: string): Promise<string> {
  const systemPrompt = `You are an activity planning expert AI. Suggest engaging, meaningful activities that strengthen relationships and create positive shared experiences.`;
  
  const prompt = `Generate 3 diverse activity ideas for spending quality time with ${relationshipName} (${relationshipType}).

Context:
- Preferences: ${JSON.stringify(preferences)}
- Desired mood: ${mood}

Suggest activities that are:
1. Engaging and meaningful for both people
2. Appropriate for the relationship type
3. Match the desired mood

Include both indoor and outdoor options. Format as a numbered list.`;

  return await callAI(prompt, systemPrompt);
}

export async function craftMessage(relationshipName: string, relationshipType: string, preferences: any, goal: string, length: string, keywords?: string): Promise<string> {
  const systemPrompt = `You are an expert communication coach specializing in authentic, heartfelt expression. Help craft messages that genuinely convey emotions and strengthen relationships through thoughtful, personal communication.`;
  
  const prompt = `Draft a ${length} message for ${relationshipName} (${relationshipType}) with the goal: "${goal}".

Context:
- Preferences: ${JSON.stringify(preferences)}
- Keywords to include: ${keywords || 'None specified'}

Create a message that is:
1. Authentic and heartfelt
2. Appropriate for the relationship type
3. Incorporates their preferences naturally
4. Achieves the communication goal
5. Feels personal and meaningful

After the message, provide brief feedback on how to make it even more impactful.`;

  return await callAI(prompt, systemPrompt);
}

export async function analyzeCommunication(message: string, relationshipType: string, preferences: any): Promise<string> {
  const systemPrompt = `You are a neutral communication analyst. Provide constructive, actionable feedback to improve message clarity, warmth, and emotional impact without being judgmental.`;
  
  const prompt = `Analyze this message for a ${relationshipType} relationship:

"${message}"

Context about recipient:
- Preferences: ${JSON.stringify(preferences)}

Provide:
1. Sentiment analysis (positive/neutral/negative)
2. Potential emotional impact
3. Areas for improvement
4. Specific suggestions to enhance warmth and connection

Be encouraging and constructive in your feedback.`;

  return await callAI(prompt, systemPrompt);
}