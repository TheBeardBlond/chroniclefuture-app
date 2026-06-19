export default async function handler(req, res) {
  try {
    // Extract the user message from the frontend payload
    const userMessage =
      req.body?.messages?.[0]?.content ||
      req.body?.prompt ||
      "Generate civic analysis for Bay City, MI 48708";

    // Call Anthropic Messages API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    const data = await response.json();

    // Anthropic ALWAYS returns: { content: [ { type: "text", text: "..." } ] }
    const text = data?.content?.[0]?.text;

    if (!text) {
      console.error("Anthropic returned no text:", data);
      return res.status(200).json({ text: "No content returned from Anthropic." });
    }

    // SUCCESS
    res.status(200).json({ text });
  } catch (error) {
    console.error("API /generate error:", error);
    res.status(500).json({ text: "Server error calling Anthropic." });
  }
}
