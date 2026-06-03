import { GoogleGenAI } from "@google/genai";

export const geminiModel = "gemini-flash-latest"; // Using flash for speed

const getAI = () => {
  const customKey = typeof window !== "undefined" ? localStorage.getItem("aniki-gemini-api-key") : null;
  const apiKey = customKey || process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    throw new Error("API Key tidak ditemukan! Harap lengkapi API Key Google AI Studio di menu 'PENGATURAN API' terlebih dahulu.");
  }
  return new GoogleGenAI({ apiKey });
};

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

  const response = await getAI().models.generateContent({
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
  imageDatas?: string[]; // array of base64 strings
}

export async function generateRecapScript(params: GenerateScriptParams) {
  const { mangaTitle, format, style, mode, imageDatas } = params;

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
    "Seri": "Script panjang detail per chapter, dramatis, dengan alur yang runtut."
  }[mode];

  const prompt = `
    Kamu adalah Content Creator Manga Recap (YouTuber) terbaik "Manga Only Studio" yang punya gaya bercerita sangat asyik, santai, dramatis, dan sangat mendalam.
    Tugasmu adalah membuat NASKAH VIDEO RECAP MANGA yang SANGAT DETAIL, LENGKAP, dan MENGALIR dari ${format} berjudul "${mangaTitle}".
    
    MODE: ${modeContext}
    GAYA BAHASA: ${styleContext} (Pastikan narasi terasa sangat natural, mengalir, tanpa basa-basi berlebih).

    ATURAN EMAS DAN PENTING (WAJIB DIPATUHI SECARA MUTLAK):
    1. WAJIB MEMULAI KALIMAT PERTAMA NASKAH DENGAN: "diawal cerita .... " (Gunakan format persis seperti ini di awal hasil generatemu).
    2. JANGAN PERNAH MEMASUKKAN KATA '[ADADEGAN:.....]' ATAU MARKER SCENE APAPUN: Hilangkan semua penanda adegan, judul babak, kurung siku, dan penomoran. Output harus murni berupa narasi paragraf tanpa marker sama sekali.
    3. JANGAN BASA-BASI HINGGA BERTELE-TELE: Langsung bahas ke inti cerita dari detik pertama! Jangan lakukan pembukaan bertele-tele, sapaan penonton, perkenalan diri, atau basa-basi apa pun. Fokus langsung to the point.
    4. JANGAN DIRANGKUM (NO SUMMARY): Ceritakan setiap peristiwa secara detail, padat, dan luas dari awal sampai akhir. Luaskan alurnya seakan-akan penonton sedang menikmati adegan di bioskop secara langsung.
    5. PENALAAN MEMBACA DARI KANAN KE KIRI (RTL - Right-to-Left): Ingat ini adalah ${format}, cara membacanya harus sesuai tata letak standar dari KANAN ke KIRI untuk setiap bagian panel di gambar. Hubungkan tiap panel secara urut (Gambar 1 -> Gambar 2 -> dst).
    6. WAJIB MEMASUKKAN SEMUA GELEMBUNG DIALOG / PROLOG / MONOLOG / TEKS: Semua teks narasi, prolog, balon ucapan dialog karakter, dan gumaman kata batin yang ada di gambar harus masuk ke dalam narasi naskah! JANGAN ADA SATUPUN YANG TERLEWAT! Sampaikan semua percakapan tersebut ke dalam narasi bahasa Indonesia yang luwes dan asyik. Jangan melenceng dari teks asli panel.
    7. HINDARI SOUND EFFECT (SFX): Jangan pernah menuliskan atau membacakan teks efek suara seperti "DARR!", "BOOM!", "SREET!", "BANG!", "SWOSH!", "Suara tembakan", dll. Sebagai gantinya, cukup ceritakan bagaimana gerakan pertempuran/kejadian tersebut berjalan secara dramatis (Misal: "dia melompat menghindari tebasan pedang dengan kecepatan luar biasa yang membelah udara").
    8. TAHU SELURUH ALUR CERITA (SUDAH PARIPURNA): Tulis narasi seolah-olah kamu adalah seorang sepuh yang sudah mengerti betul alur cerita, karakter, latar belakang canon, dan nasib kelanjutan dari kisah komik ini secara sempurna.
    9. JANGAN HALU (AKURAT): Jangan menambahkan halusinasi yang melenceng atau mengada-ngada di luar apa yang ditampilkan oleh panel gambar dan cerita asli.

    INSTRUKSI TEKNIS:
    - **JANGAN PERNAH** menggunakan kata 'panel', 'gambar', 'halaman', atau posisi geometris (seperti kanan atas, kiri bawah, gambar 1, gambar 2). Sampaikan secara mengalir sebagai bagian dari alur kisah.
    - Output harus berupa satu naskah narasi utuh tanpa adegan/marker, langsung diawali dengan: "diawal cerita .... "
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

  const response = await getAI().models.generateContent({
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

  const response = await getAI().models.generateContent({
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

  const response = await getAI().models.generateContent({
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

  // If still no scenes found, treat the paragraphs as scenes for neat layout visualization
  if (scenes.length === 0) {
    const cleanText = rawText.replace(/\[(ADADEGAN|SCENE):.*?\]/g, "").trim();
    if (cleanText) {
      const paragraphs = cleanText.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);
      if (paragraphs.length > 1) {
        paragraphs.forEach((p, idx) => {
          scenes.push({
            title: `Alur ${idx + 1}`,
            narrative: p
          });
        });
      } else {
        scenes.push({
          title: "Naskah Utama",
          narrative: cleanText
        });
      }
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
