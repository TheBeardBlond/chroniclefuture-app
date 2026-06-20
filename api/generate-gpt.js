export default async function handler(req, res) {
  try {
    const userMessage =
      req.body?.messages?.[0]?.content ||
      req.body?.prompt ||
      "Generate civic analysis for Bay City, MI 48708";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: req.body?.max_tokens || 2048
      })
    });

    const data = await response.json();

    const text =
      data?.choices?.[0]?.message?.content ||
      "No content returned from GPT.";

    res.status(200).json({ text });
  } catch (error) {
    console.error("GPT API error:", error);
    res.status(500).json({ text: "Server error calling GPT." });
  }
}
