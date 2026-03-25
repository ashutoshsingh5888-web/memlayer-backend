export default async function handler(req, res) {
  try {
    // ✅ Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { messages } = req.body;

    // ✅ Validate input
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    // ✅ Check API key
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    // ✅ Build prompt
    const prompt = `
You are a context compressor.

Summarize this conversation into:
- Tone
- Intent
- Key Points
- Recent Context

Keep under 120 words.

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join("\n")}
`;

    // ✅ Call OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://memlayer", // required for some models
        "X-Title": "memlayer"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", // ✅ stable model
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    // ✅ Handle OpenRouter errors
    if (data.error) {
      console.error("OpenRouter Error:", data.error);
      return res.status(500).json({
        error: data.error.message || "OpenRouter error"
      });
    }

    // ✅ Extract result safely
    const result = data?.choices?.[0]?.message?.content;

    if (!result) {
      return res.status(500).json({
        error: "No response from model",
        raw: data
      });
    }

    // ✅ Success
    return res.status(200).json({
      result
    });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({
      error: err.message || "Server error"
    });
  }
}
