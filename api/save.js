export default async function handler(req, res) {  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const body = req.body;

  console.log("Saving report:", body);

  // ✅ For now just confirm it works
  res.status(200).json({ success: true });
}
