import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes FIRST
  app.post("/api/recap", async (req, res) => {
    try {
      const { mangaTitle, format, style, mode, imageDatas } = req.body;
      
      const styleContext = {
        "Santai Tongkrongan": "Gaya YouTuber santai, pakai gue/lu/cuy, asyik, kayak lagi cerita ke temen. Sering pakai kata 'anjir', 'parah sih', 'fix', 'gila'.",
        "Storytelling Serius": "Gaya YouTuber narasi mendalam, fokus pada emosi dan detail alur, tetap asyik didengar tapi lebih berbobot.",
        "Dramatis": "Gaya YouTuber dramatis, penuh penekanan pada momen epic, bikin bulu kuduk merinding dengan diksi yang kuat.",
        "Funny / Roasting": "Gaya YouTuber roasting, penuh sarkasme lucu, ngejek kelakuan MC yang aneh, ekspresif dan kocak.",
        "Cinematic Trailer": "Gaya YouTuber trailer, suara berat, penuh jeda dramatis, seolah-olah lagi nunggu movie baru rilis.",
        "Meme Recap": "Gaya YouTuber meme, cepat, banyak referensi pop culture, sangat santai, dan penuh energi 'chaos' yang seru."
      }[style as keyof typeof styleContext] || "Gaya YouTuber santai";

      const modeContext = {
        "Kilat": "Recap singkat padat dalam 1-3 chapter. Fokus pada inti konflik.",
        "Seri": "Script panjang detail per chapter, dramatis, dengan alur yang runtut."
      }[mode as keyof typeof modeContext] || "Recap singkat padat";

      const prompt = `
        Kamu adalah naskah asisten profesional yang bertugas menulis NASKAH VIDEO RECAP komik ${format} berjudul "${mangaTitle}" dengan suara pencerita murni.
        
        ATURAN STRUKTUR & FILTER (WAJIB DIPATUHI SECARA MUTLAK):
        1. JANGAN ADA BASA-BASI AWAL DAN AKHIR: Dilarang keras menulis pembukaan berupa sapaan ("Halo penonton", "Kembali lagi di channel...", "Halo guys"), promosi, perkenalan diri, request subscribe, kesimpulan di akhir, atau basa-basi apa pun. Jangan ada kalimat pengantar sebelum naskah utama dimulai!
        2. KALIMAT PERTAMA WAJIB DIAWALI DENGAN: "diawal cerita .... " (Gunakan format huruf kecil semua dan empat titik persis seperti ini).
        3. TO THE POINT & LANGSUNG KE INTINYA: Mulai dari kata pertama "diawal cerita .... ", langsung ceritakan kejadian pertama yang tertulis di panel paling kanan secara runut dan detail.
        4. CARA BACA KANAN KE KIRI (Right-to-Left): Untuk ${format}, urutan kejadian dan dialog di dalam satu halaman harus dibaca dari KANAN ke KIRI secara konsisten. Hubungkan peristiwa antar panel dengan alur yang dinamis.
        5. SEMUA DIALOG & TEKS WAJIB MASUK: Semua teks di gelembung dialog, batin/monolog karakter, narasi samping/kotak narator HARUS disisipkan sepenuhnya ke dalam aliran naskah. Jangan diringkas atau dilewatkan sedikit pun! Terjemahkan teks tersebut ke dalam percakapan bahasa Indonesia yang dinamis dan menyatu dengan cerita.
        6. HINDARI SFX (SANGAT PENTING): Jangan pernah menulis kata-kata efek suara tiruan seperti "DARR!", "BOOM!", "SREET!", "SWOSH!", "Suara tembakan!", "Tebasan pedang berbunyi slash!". Sebalikya, ganti dengan menceritakan aksi atau dampak dari pertarungan tersebut (contoh: "dia melesat maju menghindari serangan musuh yang menghancurkan tanah di belakangnya").
        7. TUNJUKKAN SEOLAH-OLAH KAMU SUDAH TAHU SEPENUHNYA ALUR CERITANYA: Ceritakan alur kisah ini dengan rasa percaya diri penuh, seperti seorang ahli yang sudah hafal mati seluruh perjalanan hidup karakter, asal-usul kekuatannya, dan rahasia besar di komik ini.
        8. PARAGRAF NARASI MURNI: Jangan gunakan bullet points, jangan sebut nomor panel ("panel 1", "gambar kedua"), jangan gunakan header babak, dan hilangkan penanda seperti "[ADADEGAN:...]". Output harus murni berupa jalinan cerita yang terus mengalir indah.

        GAYA BAHASA: ${styleContext} (Pastikan tidak kaku, bahasa mengalir alami sesuai gaya yang dipilih).
      `;

      const contents: any[] = [{ text: prompt }];
      
      if (imageDatas && imageDatas.length > 0) {
        imageDatas.forEach((data: string) => {
          const parts = data.split(",");
          const base64Data = parts[1] || parts[0];
          contents.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          });
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: contents }
      });

      res.json({ script: response.text });
    } catch (error: any) {
      console.error("Error generating recap script:", error);
      res.status(500).json({ error: error.message || "Failed to generate recap script." });
    }
  });

  app.post("/api/hooks", async (req, res) => {
    try {
      const { script } = req.body;
      const prompt = `
        Berdasarkan alur cerita manga yang dramatis berikut, buatlah 3 variasi Kalimat Pembuka (Gripping Opening) yang sanggup langsung menarik pembaca ke dalam atmosfer cerita.
        Gunakan gaya bahasa yang provokatif, emosional, atau penuh misteri.
        
        ALUR CERITA:
        ${script.substring(0, 3000)}
        
        Berikan output dalam list sederhana tanpa judul tambahan.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [{ text: prompt }] }
      });

      res.json({ hooksText: response.text });
    } catch (error: any) {
      console.error("Error generating hooks:", error);
      res.status(500).json({ error: error.message || "Failed to generate hooks." });
    }
  });

  app.post("/api/ctr", async (req, res) => {
    try {
      const { script } = req.body;
      const prompt = `
        Berdasarkan alur cerita manga berikut, buatlah:
        1. 5 Judul yang menggugah rasa penasaran (Story-driven titles).
        2. 3 Konsep Visual untuk Thumbnail yang merepresentasikan momen paling ikonik atau emosional.
        
        ALUR CERITA:
        ${script.substring(0, 2000)}
        
        Format Output:
        [TITLES]
        - (Judul 1)
        - (Judul 2)
        ...
        [THUMBNAILS]
        - Teks: (Teks yang ada di thumbnail) | Konsep: (Deskripsi visual thumbnail yang dramatis)
        ...
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [{ text: prompt }] }
      });

      res.json({ ctrText: response.text });
    } catch (error: any) {
      console.error("Error generating CTR elements:", error);
      res.status(500).json({ error: error.message || "Failed to generate CTR elements." });
    }
  });

  app.post("/api/cover", async (req, res) => {
    try {
      const { prompt, aspectRatio = "16:9" } = req.body;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              text: `Create a high-quality manga/manhwa style cover illustration. 
              Subject: ${prompt}. 
              Style: Vibrant colors, dynamic composition, professional digital art, anime aesthetic.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      let imageUrl = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Error generating cover image:", error);
      res.status(500).json({ error: error.message || "Failed to generate cover image." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
