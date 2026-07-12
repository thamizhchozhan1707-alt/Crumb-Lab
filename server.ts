import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini
  let ai: GoogleGenAI | null = null;
  const getAi = () => {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is not defined in the environment.");
      }
      ai = new GoogleGenAI({ apiKey: apiKey || "" });
    }
    return ai;
  };

  // API Route for AI Advisor
  app.post("/api/ai-advisor", async (req, res) => {
    try {
      const { recipe, query, type } = req.body;
      const client = getAi();
      
      let systemInstruction = "You are the Senior Food Scientist and AI Cookie Advisor at CrumbLab R&D Lab, a premium functional cookie research facility. " +
        "You analyze cookie recipes (incorporating functional ingredients like protein, adaptogens, fibers, or superfoods) to optimize for texture, cost, taste, and nutrition. " +
        "Your responses should be highly scientific, precise, elegant, and deeply structured, aligning with our luxury and minimalist ethos. " +
        "Use markdown to structure your recommendations, with sections, chemical/food-science reasoning, and practical adjustments. Avoid conversational clutter and write like a prestigious food lab consultant.";

      let prompt = "";
      if (type === "optimize-cost") {
        prompt = `Analyze the recipe "${recipe.name}" with a current cost of ₹${recipe.costPerCookie?.toFixed(2)} per cookie.\n` +
          `Ingredients:\n${JSON.stringify(recipe.ingredients, null, 2)}\n\n` +
          `Suggest specific ways to optimize the cost of this functional cookie without compromising its premium taste profile or functional active ingredient content. Look for ratio adjustments, flour/sugar alternatives, or process improvements.`;
      } else if (type === "improve-texture") {
        prompt = `Analyze the bake profile and texture details of "${recipe.name}".\n` +
          `Baking Profile: Temp: ${recipe.tempF || 350}°F, Time: ${recipe.timeMins || 12} mins.\n` +
          `Known Texture Notes: ${recipe.textureAnalysis || "N/A"}\n` +
          `Ingredients:\n${JSON.stringify(recipe.ingredients, null, 2)}\n\n` +
          `Explain the food chemistry occurring in this cookie and suggest baking profile adjustments or binding agent modifications (like starches, fats, hydration levels, or lecithin) to achieve the perfect functional cookie texture (e.g. crisp exterior, dense chewy center) without sacrificing nutritional integrity.`;
      } else if (type === "suggest-functional-boost") {
        prompt = `Analyze the recipe "${recipe.name}" with ingredients:\n${JSON.stringify(recipe.ingredients, null, 2)}\n\n` +
          `The goal is to introduce or enhance functional benefit profiles (e.g., cognitive boost/nootropics, sustained energy, muscle recovery, gut health, or relaxation) in our cookie product.\n` +
          `Suggest premium functional ingredients (such as Ashwagandha extract, L-Theanine, Lion's Mane mushroom, whey/pea protein isolates, prebiotic fibers, or MCT oil) to incorporate, including recommended dosages (mg/g per serving) and sensory adjustments needed to mask earthy or bitter off-flavors.`;
      } else {
        // general query
        prompt = `Analyze the following recipe or request:\n` +
          `Recipe: "${recipe.name}"\n` +
          `Ingredients:\n${JSON.stringify(recipe.ingredients, null, 2)}\n` +
          `User request: "${query}"\n\n` +
          `Provide scientific guidance, food chemistry insights, and cookie formulation wisdom on how to proceed.`;
      }

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text || "No advice generated." });
    } catch (error: any) {
      console.error("AI Advisor Error:", error);
      res.status(500).json({ error: error.message || "An error occurred with the AI Advisor service." });
    }
  });

  // Serve static/vite assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
