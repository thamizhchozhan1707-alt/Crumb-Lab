import { Ingredient, Recipe, Experiment } from "../types";

export const initialIngredients: Ingredient[] = [
  {
    id: "ing-lions-mane",
    name: "Lion's Mane Mushroom Extract 10:1",
    category: "Functional Actives",
    stock: 500,
    unit: "g",
    unitCost: 15.00,
    supplier: "Aura Mycologicals",
    minStock: 100,
    updatedAt: new Date().toISOString()
  },
  {
    id: "ing-ashwagandha",
    name: "Ashwagandha Extract KSM-66",
    category: "Functional Actives",
    stock: 350,
    unit: "g",
    unitCost: 20.00,
    supplier: "Himalayan Botanicals",
    minStock: 50,
    updatedAt: new Date().toISOString()
  },
  {
    id: "ing-l-theanine",
    name: "L-Theanine Pure Powder",
    category: "Functional Actives",
    stock: 400,
    unit: "g",
    unitCost: 12.00,
    supplier: "Nootropics Depot",
    minStock: 50,
    updatedAt: new Date().toISOString()
  },
  {
    id: "ing-magnesium",
    name: "Magnesium L-Threonate",
    category: "Functional Actives",
    stock: 300,
    unit: "g",
    unitCost: 18.00,
    supplier: "MagTech Labs",
    minStock: 100,
    updatedAt: new Date().toISOString()
  },
  {
    id: "ing-whey-protein",
    name: "Grass-Fed Whey Protein Isolate",
    category: "Functional Actives",
    stock: 2000,
    unit: "g",
    unitCost: 5.00,
    supplier: "Glazebrook Dairy",
    minStock: 500,
    updatedAt: new Date().toISOString()
  },
  {
    id: "ing-almond-flour",
    name: "Superfine California Almond Flour",
    category: "Flours",
    stock: 5000,
    unit: "g",
    unitCost: 1.50,
    supplier: "Bob's Red Mill",
    minStock: 1500,
    updatedAt: new Date().toISOString()
  },
  {
    id: "ing-allulose",
    name: "Granular Non-GMO Allulose",
    category: "Sweeteners",
    stock: 4000,
    unit: "g",
    unitCost: 0.80,
    supplier: "Keystone Sweeteners",
    minStock: 1000,
    updatedAt: new Date().toISOString()
  },
  {
    id: "ing-butter",
    name: "Organic Cultured Grass-Fed Butter",
    category: "Fats",
    stock: 3000,
    unit: "g",
    unitCost: 1.20,
    supplier: "Irish Meadows",
    minStock: 800,
    updatedAt: new Date().toISOString()
  },
  {
    id: "ing-dark-choc",
    name: "85% Extra Dark Chocolate Chips",
    category: "Inclusions",
    stock: 2500,
    unit: "g",
    unitCost: 2.00,
    supplier: "Guittard Chocolates",
    minStock: 500,
    updatedAt: new Date().toISOString()
  },
  {
    id: "ing-lavender",
    name: "Organic Culinary Dried Lavender Buds",
    category: "Inclusions",
    stock: 150,
    unit: "g",
    unitCost: 8.00,
    supplier: "Provence Botanics",
    minStock: 30,
    updatedAt: new Date().toISOString()
  }
];

export const initialRecipes: Recipe[] = [
  {
    id: "rec-cognitive-peak",
    name: "Cognitive Peak Double Chocolate",
    version: 2,
    category: "Cognitive/Nootropic",
    ingredients: [
      { id: "ing-lions-mane", name: "Lion's Mane Mushroom Extract 10:1", amount: 2, unit: "g", unitCost: 15.00 },
      { id: "ing-l-theanine", name: "L-Theanine Pure Powder", amount: 0.4, unit: "g", unitCost: 12.00 },
      { id: "ing-almond-flour", name: "Superfine California Almond Flour", amount: 45, unit: "g", unitCost: 1.50 },
      { id: "ing-allulose", name: "Granular Non-GMO Allulose", amount: 30, unit: "g", unitCost: 0.80 },
      { id: "ing-butter", name: "Organic Cultured Grass-Fed Butter", amount: 25, unit: "g", unitCost: 1.20 },
      { id: "ing-dark-choc", name: "85% Extra Dark Chocolate Chips", amount: 20, unit: "g", unitCost: 2.00 }
    ],
    instructions: "1. Cream the butter and granular allulose in a luxury stand mixer until airy.\n2. Gently sift almond flour, Lion's Mane extract, and L-Theanine powder into the mixture.\n3. Fold in the 85% extra dark chocolate chips manually to preserve their structural shape.\n4. Portion into precise 30g spheres using a scientific cookie disher.\n5. Bake at 325°F for exactly 11 minutes.",
    tempF: 325,
    timeMins: 11,
    textureAnalysis: "Crisp and firm exterior perimeter, giving way to a dense, fudgy, and ultra-chewy crumb structure. Excellent moisture-holding capacity from the butter-fat ratio.",
    tasteRating: 5,
    costPerCookie: 145.00,
    notes: "Formulated specifically to eliminate the standard bitter aftertaste of Lion's Mane. The high cocoa butter content from the 85% chocolate chips successfully masks the mycelial earthiness, while L-Theanine provides a clean, synergistic focus boost without caffeine jitters.",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: "Senior Food Scientist",
    history: [
      {
        version: 1,
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedBy: "Junior Lab Associate",
        ingredients: [
          { id: "ing-lions-mane", name: "Lion's Mane Mushroom Extract 10:1", amount: 1.5, unit: "g", unitCost: 15.00 },
          { id: "ing-almond-flour", name: "Superfine California Almond Flour", amount: 50, unit: "g", unitCost: 1.50 },
          { id: "ing-allulose", name: "Granular Non-GMO Allulose", amount: 35, unit: "g", unitCost: 0.80 },
          { id: "ing-butter", name: "Organic Cultured Grass-Fed Butter", amount: 30, unit: "g", unitCost: 1.20 },
          { id: "ing-dark-choc", name: "85% Extra Dark Chocolate Chips", amount: 15, unit: "g", unitCost: 2.00 }
        ],
        instructions: "Original formula draft without L-Theanine stabilization.",
        tempF: 350,
        timeMins: 10,
        notes: "Recipe was too sweet, had a slight lingering mushroom aroma. Lacked standard calming focus synergies."
      }
    ]
  },
  {
    id: "rec-zen-sleep",
    name: "Zen Sleep Lavender Shortbread",
    version: 1,
    category: "Relaxation",
    ingredients: [
      { id: "ing-magnesium", name: "Magnesium L-Threonate", amount: 1.5, unit: "g", unitCost: 18.00 },
      { id: "ing-ashwagandha", name: "Ashwagandha Extract KSM-66", amount: 0.8, unit: "g", unitCost: 20.00 },
      { id: "ing-almond-flour", name: "Superfine California Almond Flour", amount: 60, unit: "g", unitCost: 1.50 },
      { id: "ing-allulose", name: "Granular Non-GMO Allulose", amount: 20, unit: "g", unitCost: 0.80 },
      { id: "ing-butter", name: "Organic Cultured Grass-Fed Butter", amount: 35, unit: "g", unitCost: 1.20 },
      { id: "ing-lavender", name: "Organic Culinary Dried Lavender Buds", amount: 1, unit: "g", unitCost: 8.00 }
    ],
    instructions: "1. Whip cold butter with granular allulose until a pale paste forms.\n2. Incorporate lavender buds directly into the butter base to release natural aromatic terpenes.\n3. Add Ashwagandha, Magnesium Threonate, and almond flour. Knead gently until a smooth, non-sticky dough is achieved.\n4. Press into shortbread molds and chill for 20 minutes before baking.\n5. Slow-bake at 300°F for exactly 15 minutes.",
    tempF: 300,
    timeMins: 15,
    textureAnalysis: "Delicate, melt-in-the-mouth shortbread crumb. Minimal gluten-like elasticity, highly crisp borders, with a smooth and dry but comforting finish.",
    tasteRating: 4.6,
    costPerCookie: 115.00,
    notes: "Designed for evening wind-down rituals. The lavender lavender oil works synergistically with Ashwagandha to promote GABA receptor pathways. Magnesium L-Threonate cross the blood-brain barrier effectively. Highly recommended paired with organic chamomile tea.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedBy: "Senior Food Scientist"
  },
  {
    id: "rec-protein-fuel",
    name: "Bio-Active Protein Recovery",
    version: 1,
    category: "Muscle Recovery/Protein",
    ingredients: [
      { id: "ing-whey-protein", name: "Grass-Fed Whey Protein Isolate", amount: 18, unit: "g", unitCost: 5.00 },
      { id: "ing-almond-flour", name: "Superfine California Almond Flour", amount: 30, unit: "g", unitCost: 1.50 },
      { id: "ing-butter", name: "Organic Cultured Grass-Fed Butter", amount: 20, unit: "g", unitCost: 1.20 },
      { id: "ing-allulose", name: "Granular Non-GMO Allulose", amount: 20, unit: "g", unitCost: 0.80 },
      { id: "ing-dark-choc", name: "85% Extra Dark Chocolate Chips", amount: 15, unit: "g", unitCost: 2.00 }
    ],
    instructions: "1. Combine dry ingredients including whey protein isolate and almond flour thoroughly.\n2. Melt the cultured butter and stir into the dry blend to hydrate the milk proteins evenly.\n3. Roll into logs and cut into uniform cookies.\n4. Bake at 340°F for 10 minutes to avoid whey protein denaturing or hardening.",
    tempF: 340,
    timeMins: 10,
    textureAnalysis: "Heavy, dense, bread-like soft bake structure. Protein creates a tight peptide matrix which holds moisture but requires cautious baking times to avoid chalkiness.",
    tasteRating: 4.2,
    costPerCookie: 155.00,
    notes: "Delivers 15g of premium bio-available protein per cookie. Designed for post-workout recovery. High levels of Branched-Chain Amino Acids (BCAAs). The texture is slightly denser than traditional cookies due to whey protein absorption.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedBy: "R&D Culinary Lead"
  }
];

export const initialExperiments: Experiment[] = [
  {
    id: "exp-001",
    recipeId: "rec-cognitive-peak",
    recipeName: "Cognitive Peak Double Chocolate",
    title: "Evaluation of L-Theanine and Vanilla Masking",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    variablesChanged: "Added 0.4g of L-Theanine and increased vanilla extract for mycelial earthiness masking.",
    bakingTemp: 325,
    bakingTime: 11,
    observations: "Mushroom taste is completely absent. Sensory panel rated bitter notes as 'Undetectable'. The vanilla aromatics pair exceptionally with the high cocoa content of Guittard dark chips.",
    textureRating: 5,
    tasteRating: 5,
    costPerCookie: 145.00,
    status: "Successful",
    createdBy: "Senior Food Scientist"
  },
  {
    id: "exp-002",
    recipeId: "rec-zen-sleep",
    recipeName: "Zen Sleep Lavender Shortbread",
    title: "Alternative Baking Profile Trial - High Temp Speed Bake",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    variablesChanged: "Increased temperature to 325°F and reduced duration to 11 minutes.",
    bakingTemp: 325,
    bakingTime: 11,
    observations: "Unsuccessful bake profile. Edge scorched while the center remained under-baked. High-fat butter paste is highly heat-sensitive; slow dry baking at 300°F is necessary to preserve shape and shortbread texture.",
    textureRating: 2.5,
    tasteRating: 3.8,
    costPerCookie: 115.00,
    status: "Failed",
    createdBy: "Junior Lab Associate"
  }
];
