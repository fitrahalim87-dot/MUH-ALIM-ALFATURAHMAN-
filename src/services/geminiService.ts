export const geminiModel = "gemini-3.5-flash";

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

export async function generateCoverImage(params: GenerateImageParams): Promise<string | null> {
  const response = await fetch("/api/cover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Gagal membuat gambar sampul dari backend.");
  }
  const data = await response.json();
  return data.imageUrl;
}

export interface GenerateScriptParams {
  mangaTitle: string;
  format: FormatType;
  style: ScriptStyle;
  mode: ScriptMode;
  imageDatas?: string[]; // array of base64 strings
}

export async function generateRecapScript(params: GenerateScriptParams): Promise<string> {
  const response = await fetch("/api/recap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Gagal membuat naskah recap.");
  }
  const data = await response.json();
  return data.script;
}

export async function generateHooks(script: string): Promise<string[]> {
  const response = await fetch("/api/hooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Gagal membuat kalimat pembuka.");
  }
  const data = await response.json();
  
  return data.hooksText
    .split("\n")
    .filter((l: string) => l.trim())
    .map((l: string) => l.replace(/^\d+\.\s*/, "").replace(/^-\s*/, "").trim());
}

export async function generateCTR(script: string): Promise<{ titles: string[], thumbnails: { text: string, concept: string }[] }> {
  const response = await fetch("/api/ctr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Gagal membuat ide judul dan thumbnail.");
  }
  const data = await response.json();
  const raw = data.ctrText;
  
  const titles = raw.match(/\[TITLES\]([\s\S]*?)\[THUMBNAILS\]/)?.[1]?.trim().split("\n").filter((l: string) => l.trim()).map((l: string) => l.replace(/^-\s*/, "").trim()) || [];
  const thumbnailsRaw = raw.match(/\[THUMBNAILS\]([\s\S]*)/)?.[1]?.trim().split("\n").filter((l: string) => l.trim()) || [];
  
  const thumbnails = thumbnailsRaw.map((t: string) => {
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
  
  const sceneRegex = /(?:(?:\*\*|###|#|)\s*)?\[ADADEGAN:\s*(.*?)\]\s*(?:\*\*|)?([\s\S]*?)(?=(?:\*\*|###|#|)\s*\[ADADEGAN:|$)/g;
  let match;
  
  while ((match = sceneRegex.exec(rawText)) !== null) {
    const title = match[1]?.trim() || "Scene Untitled";
    let narrative = match[2]?.trim() || "";
    
    narrative = narrative.replace(/\[ADADEGAN:.*?\]$/, "").trim();
    
    if (narrative) {
      scenes.push({ title, narrative });
    }
  }

  if (scenes.length === 0) {
    const fallbackRegex = /(?:(?:\*\*|###|#|)\s*)?\[SCENE:\s*(.*?)\]\s*(?:\*\*|)?([\s\S]*?)(?=(?:\*\*|###|#|)\s*\[SCENE:|$)/g;
    while ((match = fallbackRegex.exec(rawText)) !== null) {
      scenes.push({
        title: match[1]?.trim() || "Scene Untitled",
        narrative: match[2]?.trim() || ""
      });
    }
  }

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
