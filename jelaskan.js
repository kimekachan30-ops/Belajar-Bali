// Backend kecil (serverless function) untuk Vercel.
// Fungsinya: menyimpan API key dengan aman dan memanggil AI.
// Key diambil dari environment variable, JANGAN ditulis di sini.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ jawaban: "Gunakan POST" });

  const { kata, kalimat, kamus } = req.body || {};
  if (!kata || !kalimat) return res.status(400).json({ jawaban: "Data kurang" });

  // Batasi panjang input supaya tidak disalahgunakan
  const aman = String(kata).slice(0, 40);
  const kalimatAman = String(kalimat).slice(0, 200);

  const instruksi =
    "Kamu membantu orang belajar Bahasa Bali. Jelaskan arti kata yang ditanyakan " +
    "dalam Bahasa Indonesia, singkat (maksimal 2 kalimat). Utamakan data kamus berikut: " +
    JSON.stringify(kamus || {}) + ". Jika kamu tidak yakin, katakan terus terang " +
    "'Saya tidak yakin, tanyakan ke guru' dan jangan mengarang.";

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 200,
        system: instruksi,
        messages: [{ role: "user", content: `Kata: "${aman}". Kalimat: "${kalimatAman}".` }]
      })
    });
    const data = await r.json();
    const teks = data.content && data.content[0] ? data.content[0].text : "AI tidak menjawab.";
    res.status(200).json({ jawaban: teks });
  } catch (e) {
    res.status(500).json({ jawaban: "Gagal menghubungi AI." });
  }
}