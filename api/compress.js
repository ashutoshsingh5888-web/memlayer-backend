export default async function handler(req, res) {
  try {
    const { messages } = req.body;

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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-small",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    res.status(200).json({
      result: data?.choices?.[0]?.message?.content || "Failed"
    });

  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
}
