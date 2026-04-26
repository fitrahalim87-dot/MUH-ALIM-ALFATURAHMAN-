import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const geminiModel = "gemini-flash-latest"; // Using flash for speed

export type ScriptStyle = "Santai Tongkrongan" | "Storytelling Serius" | "Dramatis" | "Funny / Roasting" | "Cinematic Trailer" | "Meme Recap";
export type ScriptMode = "Kilat" | "Seri";
export type FormatType = "Manga" | "Manhwa";

export interface ProjectData {
  id: string;
  title: string;
  mangaTitle: string;
  format: FormatType;
  style: ScriptStyle;
  mode: ScriptMode;
  script: string;
  hooks: string[];
  youtubeTitles: string[];
  thumbnailIdeas: { text: string; concept: string }[];
  durationEstimate: string;
  scenes: { title: string; narrative: string }[];
  images: string[]; // base64 inputs
  generatedAssets: string[]; // base64 outputs
  createdAt: number;
}

export interface GenerateImageParams {
  prompt: string;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
}

export async function generateCoverImage(params: GenerateImageParams) {
  const { prompt, aspectRatio = "16:9" } = params;

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

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export interface GenerateScriptParams {
  mangaTitle: string;
  format: FormatType;
  style: ScriptStyle;
  mode: ScriptMode;
  minWords: number;
  maxWords: number;
  imageDatas?: string[]; // array of base64 strings
}

export async function generateRecapScript(params: GenerateScriptParams) {
  const { mangaTitle, format, style, mode, minWords, maxWords, imageDatas } = params;

  const styleContext = {
    "Santai Tongkrongan": "Gaya YouTuber santai, pakai gue/lu/cuy, asyik, kayak lagi cerita ke temen. Sering pakai kata 'anjir', 'parah sih', 'fix', 'gila'.",
    "Storytelling Serius": "Gaya YouTuber narasi mendalam, fokus pada emosi dan detail alur, tetap asyik didengar tapi lebih berbobot.",
    "Dramatis": "Gaya YouTuber dramatis, penuh penekanan pada momen epic, bikin bulu kuduk merinding dengan diksi yang kuat.",
    "Funny / Roasting": "Gaya YouTuber roasting, penuh sarkasme lucu, ngejek kelakuan MC yang aneh, ekspresif dan kocak.",
    "Cinematic Trailer": "Gaya YouTuber trailer, suara berat, penuh jeda dramatis, seolah-olah lagi nunggu movie baru rilis.",
    "Meme Recap": "Gaya YouTuber meme, cepat, banyak referensi pop culture, sangat santai, dan penuh energi 'chaos' yang seru."
  }[style];

  const modeContext = {
    "Kilat": "Recap singkat padat dalam 1-3 chapter. Fokus pada inti konflik.",
    "Seri": "Script panjang multi-part, detail per chapter, dramatis, dengan alur yang runtut."
  }[mode];

  const prompt = `
    Kamu adalah Content Creator Manga Recap (YouTuber) terbaik "AniKi IF" yang punya gaya bercerita sangat asyik, santai, dan penuh energi.
    Tugasmu adalah membuat NASKAH VIDEO RECAP MANGA yang SANGAT DETAIL, LENGKAP, dan MENGALIR dari ${format} berjudul "${mangaTitle}".
    
    JUMLAH KATA: Minimal ${minWords} kata, Maksimal ${maxWords} kata. (Gunakan seluruh ruang ini untuk memberikan detail yang sangat mendalam).
    MODE: ${modeContext}
    GAYA BAHASA: ${styleContext}. (Pastikan narasi terasa sangat natural, mengalir, dan tidak kaku).
    
    CONTOH NADA BICARA (Gunakan sebagai referensi):
    "Gua sendiri bingung sih ya nasib MC kita di sini apes atau malah hoki gitu cuy. Nah di sini gua mau lanjutin manga yang berjudul... Ceritanya makin gila cuy! Tanpa berlama-lama lagi, otaku no jidai ga hajimaruze!"
    
    PRINSIP UTAMA: AKURASI & DETAIL (Paling Penting!)
    1. JANGAN ADA YANG TERLEWAT: Analisislah SETIAP detail kecil dalam panel manga yang diberikan. Mulai dari latar belakang, ekspresi mikro karakter, hingga benda-benda di sekitar mereka.
    2. URUTAN MUTLAK: Ceritakan urutan kejadian SESUAI GAMBAR (Gambar 1 -> Gambar 2 -> dst). Pastikan transisi antar gambar terasa sangat halus sehingga penonton tidak merasa ada lompatan adegan yang aneh.
    3. SESUAI SUMBER: Naskahmu harus 100% akurat dengan konten manga asli di gambar tersebut. Jangan memotong cerita atau meringkas terlalu pendek jika ada detail yang bisa dieksplorasi.
    
    STRUKTUR NASKAH WAJIB:
    1. VIRAL HOOK (30-50 kata): Langsung masuk ke inti konflik atau momen paling gila. Buat penonton penasaran dalam 5 detik pertama.
    2. INTRO & JUDUL: Sebutkan bahwa lu mau bahas "${mangaTitle}". Gunakan pembukaan ikonik: "Tanpa berlama-lama lagi, otaku no jidai ga hajimaruze!"
    3. STORYTELLING DETAIL & KOMPLIT: Ceritakan alur secara lengkap. Masukkan opini asyik lu sebagai narator seolah lagi nonton bareng temen (misal: "Wah gila, detail di panel ini parah banget, liat deh mukanya...").
    4. EKSPOSISI EMOSI & AKSI HIDUP: Gambarkan suasana dengan kata-kata yang hidup. Bagaimana hembusan anginnya, bagaimana detak jantung karakternya, hingga perubahan suasana cahaya di panel tersebut.
    5. DIALOG & MONOLOG BATIN: Masukkan dialog dan monolog batin karakter yang ada di panel dengan gaya bahasa yang natural agar alurnya terasa hidup dan emosional.
    6. OUTRO & TEASER NEXT PART: Akhiri dengan kesimpulan yang kuat dan ajak penonton nunggu kelanjutannya. "Gimana menurut kalian? Tulis di kolom komentar ya cuy!"

    INSTRUKSI TEKNIS:
    - **JANGAN PERNAH** menggunakan kata 'panel', 'gambar', 'halaman', atau posisi geometris (kanan atas, kiri bawah). Sebutkan saja apa yang terjadi.
    - Gunakan penanda [ADADEGAN: Judul Adegan] untuk setiap perpindahan momen atau babak penting agar pembagian scene-nya jelas.
    - Naskah harus terasa padat, berisi, dan tidak bertele-tele namun tetap LENGKAP mencakup semua kejadian di gambar.
  `;

  const contents: any[] = [{ text: prompt }];
  
  if (imageDatas && imageDatas.length > 0) {
    imageDatas.forEach((data) => {
      contents.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: data.split(",")[1]
        }
      });
    });
  }

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: { parts: contents }
  });

  return response.text;
}

export async function generateHooks(script: string) {
  const prompt = `
    Berdasarkan alur cerita manga yang dramatis berikut, buatlah 3 variasi Kalimat Pembuka (Gripping Opening) yang sanggup langsung menarik pembaca ke dalam atmosfer cerita.
    Gunakan gaya bahasa yang provokatif, emosional, atau penuh misteri.
    
    ALUR CERITA:
    ${script.substring(0, 3000)}
    
    Berikan output dalam list sederhana tanpa judul tambahan.
  `;

  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: { parts: [{ text: prompt }] }
  });
  return response.text.split("\n").filter(l => l.trim()).map(l => l.replace(/^\d+\.\s*/, "").replace(/^-\s*/, "").trim());
}

export async function generateCTR(script: string) {
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
    model: geminiModel,
    contents: { parts: [{ text: prompt }] }
  });
  
  const raw = response.text;
  const titles = raw.match(/\[TITLES\]([\s\S]*?)\[THUMBNAILS\]/)?.[1]?.trim().split("\n").filter(l => l.trim()).map(l => l.replace(/^-\s*/, "").trim()) || [];
  const thumbnailsRaw = raw.match(/\[THUMBNAILS\]([\s\S]*)/)?.[1]?.trim().split("\n").filter(l => l.trim()) || [];
  
  const thumbnails = thumbnailsRaw.map(t => {
    const parts = t.split("|");
    return {
      text: parts[0]?.replace(/^-\s*Teks:\s*/, "").replace(/^-\s*/, "").trim() || "Ide",
      concept: parts[1]?.replace(/^Konsep:\s*/, "").trim() || t
    };
  });

  return { titles, thumbnails };
}

export function parseGeminiResponse(rawText: string) {
  const scenes: { title: string; narrative: string }[] = [];
  
  // Refined regex to handle bolding, headers, or simple tags
  // Matches variations like [ADADEGAN: Title], **[ADADEGAN: Title]**, ### [ADADEGAN: Title]
  const sceneRegex = /(?:(?:\*\*|###|#|)\s*)?\[ADADEGAN:\s*(.*?)\]\s*(?:\*\*|)?([\s\S]*?)(?=(?:\*\*|###|#|)\s*\[ADADEGAN:|$)/g;
  let match;
  
  while ((match = sceneRegex.exec(rawText)) !== null) {
    const title = match[1]?.trim() || "Scene Untitled";
    let narrative = match[2]?.trim() || "";
    
    // Clean up any stray markers at the end of narrative
    narrative = narrative.replace(/\[ADADEGAN:.*?\]$/, "").trim();
    
    if (narrative) {
      scenes.push({ title, narrative });
    }
  }

  // Fallback for [SCENE: ...] tags if AI uses English
  if (scenes.length === 0) {
    const fallbackRegex = /(?:(?:\*\*|###|#|)\s*)?\[SCENE:\s*(.*?)\]\s*(?:\*\*|)?([\s\S]*?)(?=(?:\*\*|###|#|)\s*\[SCENE:|$)/g;
    while ((match = fallbackRegex.exec(rawText)) !== null) {
      scenes.push({
        title: match[1]?.trim() || "Scene Untitled",
        narrative: match[2]?.trim() || ""
      });
    }
  }

  // If still no scenes found, treat the whole thing as one scene
  if (scenes.length === 0) {
    const cleanText = rawText.replace(/\[(ADADEGAN|SCENE):.*?\]/g, "").trim();
    if (cleanText) {
      scenes.push({
        title: "Full Story",
        narrative: cleanText
      });
    }
  }

  return {
    hooks: [], 
    scenes,
    youtubeTitles: [],
    thumbnailIdeas: [],
    durationEstimate: "~" + Math.ceil(rawText.replace(/\[.*?\]/g, "").split(/\s+/).length / 130) + ":00"
  };
}
