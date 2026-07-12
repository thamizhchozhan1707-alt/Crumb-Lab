export interface IngredientRef {
  id: string;
  name: string;
  amount: number;
  unit: string;
  unitCost: number; // Cost of the unit (e.g. per gram or per unit)
}

export interface RecipeVersion {
  version: number;
  updatedAt: string;
  updatedBy: string;
  ingredients: IngredientRef[];
  instructions: string;
  tempF: number;
  timeMins: number;
  notes: string;
}

export interface Recipe {
  id: string;
  name: string;
  version: number;
  category: string; // e.g. Protein Boost, Cognitive/Nootropic, Sustained Energy, Gut Health, Relaxation
  ingredients: IngredientRef[];
  instructions: string;
  tempF: number;
  timeMins: number;
  textureAnalysis: string; // Describe sensory notes (e.g. "crispy perimeter, chewy crumb")
  tasteRating: number; // 1-5 rating
  costPerCookie: number;
  notes: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  history?: RecipeVersion[]; // Recipe version logs
}

export interface Ingredient {
  id: string;
  name: string;
  category: string; // e.g., Flours, Sweeteners, Fats, Functional Actives, Inclusions, Leaveners
  stock: number;
  unit: string; // e.g., g, kg, ml, unit
  unitCost: number; // Cost per unit (e.g., $ per gram)
  supplier: string;
  minStock: number; // Reorder threshold
  updatedAt: string;
  expiryDate?: string;
  notes?: string;
}

export interface Experiment {
  id: string;
  recipeId: string;
  recipeName: string;
  title: string;
  date: string;
  variablesChanged: string; // e.g., "Increased pea protein by 5g, reduced bake time by 1 min"
  bakingTemp: number;
  bakingTime: number;
  observations: string; // journal entry details
  textureRating: number; // 1-5 sensory rating
  tasteRating: number; // 1-5 sensory rating
  costPerCookie: number;
  status: "Planned" | "Completed" | "Failed" | "Successful";
  createdBy: string;
  imageUrl?: string;
  recipeVersion?: number;
  expectedResult?: string;
  actualResult?: string;
  notes?: string;
}
