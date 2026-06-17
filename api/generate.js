export default async function handler(req, res) {
try {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2024,
      messages: [
        {
          role: "user",
          content: req.body.prompt || "Generate civic analysis for Bay City, MI 48708"
        }
      ]
    })
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || "No content returned";
  res.status(200).json({ text });
} catch (error) {
  console.error(error);
  res.status(500).json({ error: "Server error" });
}

}
