import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { initialIngredients, initialRecipes, initialExperiments } from "./constants/initialData";

export async function seedDatabase() {
  try {
    // Check if seeded already by fetching ingredients
    const ingredRef = collection(db, "ingredients");
    const snapshot = await getDocs(ingredRef);
    if (!snapshot.empty) {
      console.log("Database already seeded.");
      return;
    }

    console.log("Seeding database with luxury functional cookie R&D data in INR (Rupees)...");
    const batch = writeBatch(db);

    initialIngredients.forEach((ing) => {
      const docRef = doc(db, "ingredients", ing.id);
      batch.set(docRef, ing);
    });

    initialRecipes.forEach((rec) => {
      const docRef = doc(db, "recipes", rec.id);
      batch.set(docRef, rec);
    });

    initialExperiments.forEach((exp) => {
      const docRef = doc(db, "experiments", exp.id);
      batch.set(docRef, exp);
    });

    await batch.commit();
    console.log("Database seeded successfully in Indian Rupees (INR).");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
