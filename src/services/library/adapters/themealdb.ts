// src/services/library/adapters/themealdb.ts
// PURPOSE: TheMealDB adapter for recipe translation
// ACTION: Fetches recipes with ingredients and instructions
// MECHANISM: REST API to themealdb.com

import { 
  LibraryAdapter, 
  IngestedContent, 
  IngestedLine, 
  IngestedPage,
  WizardConfig,
  SearchResult,
} from '../types';

const API_BASE = 'https://www.themealdb.com/api/json/v1/1';

interface Meal {
  idMeal: string;
  strMeal: string;
  strDrinkAlternate: string | null;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string;
  strIngredient1: string; strIngredient2: string; strIngredient3: string;
  strIngredient4: string; strIngredient5: string; strIngredient6: string;
  strIngredient7: string; strIngredient8: string; strIngredient9: string;
  strIngredient10: string; strIngredient11: string; strIngredient12: string;
  strIngredient13: string; strIngredient14: string; strIngredient15: string;
  strIngredient16: string; strIngredient17: string; strIngredient18: string;
  strIngredient19: string; strIngredient20: string;
  strMeasure1: string; strMeasure2: string; strMeasure3: string;
  strMeasure4: string; strMeasure5: string; strMeasure6: string;
  strMeasure7: string; strMeasure8: string; strMeasure9: string;
  strMeasure10: string; strMeasure11: string; strMeasure12: string;
  strMeasure13: string; strMeasure14: string; strMeasure15: string;
  strMeasure16: string; strMeasure17: string; strMeasure18: string;
  strMeasure19: string; strMeasure20: string;
  strSource: string;
  strImageSource: string | null;
  strCreativeCommonsConfirmed: string | null;
  dateModified: string | null;
  [key: string]: string | null;
}

interface MealResponse {
  meals: Meal[] | null;
}

// Recipe categories
export const MEAL_CATEGORIES = [
  'Beef', 'Chicken', 'Dessert', 'Lamb', 'Miscellaneous',
  'Pasta', 'Pork', 'Seafood', 'Side', 'Starter', 'Vegan', 'Vegetarian', 'Breakfast', 'Goat'
];

export const MEAL_AREAS = [
  'American', 'British', 'Canadian', 'Chinese', 'Croatian',
  'Dutch', 'Egyptian', 'French', 'Greek', 'Indian', 'Irish',
  'Italian', 'Jamaican', 'Japanese', 'Kenyan', 'Malaysian',
  'Mexican', 'Moroccan', 'Polish', 'Portuguese', 'Russian',
  'Spanish', 'Thai', 'Tunisian', 'Turkish', 'Vietnamese'
];

function getIngredients(meal: Meal): { ingredient: string; measure: string }[] {
  const ingredients: { ingredient: string; measure: string }[] = [];
  
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure?.trim() || '',
      });
    }
  }
  
  return ingredients;
}

export const themealdbAdapter: LibraryAdapter = {
  sourceId: 'themealdb',
  displayName: 'TheMealDB',

  async search(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(query)}`);
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: MealResponse = await response.json();
      
      if (!data.meals) return [];
      
      return data.meals.slice(0, limit).map(meal => ({
        id: meal.idMeal,
        title: meal.strMeal,
        subtitle: `${meal.strCategory} • ${meal.strArea}`,
        thumbnail: meal.strMealThumb + '/preview',
        meta: {
          category: meal.strCategory,
          area: meal.strArea,
        },
      }));
    } catch (error) {
      console.error('TheMealDB search error:', error);
      return [];
    }
  },

  async fetch(config: WizardConfig): Promise<IngestedContent> {
    const { selectedId, searchQuery, randomCount = 5 } = config;
    
    try {
      let meals: Meal[] = [];
      
      if (selectedId) {
        // Fetch specific meal
        const response = await fetch(`${API_BASE}/lookup.php?i=${selectedId}`);
        if (!response.ok) throw new Error('Failed to fetch recipe');
        const data: MealResponse = await response.json();
        if (data.meals) meals = data.meals;
      } else if (searchQuery) {
        // Search by name or filter by area/category
        const isArea = MEAL_AREAS.some(a => a.toLowerCase() === searchQuery.toLowerCase());
        const isCategory = MEAL_CATEGORIES.some(c => c.toLowerCase() === searchQuery.toLowerCase());
        
        let response: Response;
        if (isArea) {
          response = await fetch(`${API_BASE}/filter.php?a=${encodeURIComponent(searchQuery)}`);
        } else if (isCategory) {
          response = await fetch(`${API_BASE}/filter.php?c=${encodeURIComponent(searchQuery)}`);
        } else {
          response = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(searchQuery)}`);
        }
        
        if (!response.ok) throw new Error('Search failed');
        const data: MealResponse = await response.json();
        
        if (data.meals) {
          // If filter results, we need to fetch full details
          if (isArea || isCategory) {
            const ids = data.meals.slice(0, randomCount).map(m => m.idMeal);
            const fullMeals = await Promise.all(
              ids.map(async id => {
                const r = await fetch(`${API_BASE}/lookup.php?i=${id}`);
                const d: MealResponse = await r.json();
                return d.meals?.[0];
              })
            );
            meals = fullMeals.filter((m): m is Meal => m !== undefined);
          } else {
            meals = data.meals.slice(0, randomCount);
          }
        }
      } else {
        // Random meals
        const promises = Array(randomCount).fill(null).map(() => 
          fetch(`${API_BASE}/random.php`).then(r => r.json())
        );
        const results = await Promise.all(promises);
        meals = results.map(r => r.meals?.[0]).filter((m): m is Meal => m !== undefined);
      }
      
      if (!meals.length) {
        throw new Error('No recipes found');
      }
      
      // Build pages (one per recipe)
      const pages: IngestedPage[] = meals.map((meal, idx) => {
        const lines: IngestedLine[] = [];
        const ingredients = getIngredients(meal);
        
        // Recipe image
        lines.push({
          id: `meal-${meal.idMeal}-image`,
          type: 'image',
          L1: meal.strMealThumb,
          L2: '',
          meta: {
            imageUrl: meal.strMealThumb,
            thumbnailUrl: meal.strMealThumb + '/preview',
          },
        });
        
        // Recipe title
        lines.push({
          id: `meal-${meal.idMeal}-title`,
          type: 'heading',
          L1: meal.strMeal,
          L2: '',
        });
        
        // Meta info
        lines.push({
          id: `meal-${meal.idMeal}-meta`,
          type: 'text',
          L1: `🍽️ ${meal.strCategory} • 🌍 ${meal.strArea}`,
          L2: '',
        });
        
        // Tags
        if (meal.strTags) {
          lines.push({
            id: `meal-${meal.idMeal}-tags`,
            type: 'text',
            L1: `🏷️ ${meal.strTags.split(',').map(t => t.trim()).join(', ')}`,
            L2: '',
          });
        }
        
        // Separator
        lines.push({
          id: `meal-${meal.idMeal}-sep1`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Ingredients header
        lines.push({
          id: `meal-${meal.idMeal}-ing-header`,
          type: 'heading',
          L1: '📋 Ingredients',
          L2: '',
        });
        
        // Each ingredient
        ingredients.forEach((ing, i) => {
          lines.push({
            id: `meal-${meal.idMeal}-ing-${i}`,
            type: 'text',
            L1: `• ${ing.measure} ${ing.ingredient}`,
            L2: '',
          });
        });
        
        // Separator
        lines.push({
          id: `meal-${meal.idMeal}-sep2`,
          type: 'separator',
          L1: '',
          L2: '',
        });
        
        // Instructions header
        lines.push({
          id: `meal-${meal.idMeal}-inst-header`,
          type: 'heading',
          L1: '👨‍🍳 Instructions',
          L2: '',
        });
        
        // Instructions (split into steps)
        const steps = meal.strInstructions
          .split(/\r\n\r\n|\n\n|(?<=\.) (?=[A-Z])/)
          .filter(s => s.trim().length > 10);
        
        steps.forEach((step, i) => {
          lines.push({
            id: `meal-${meal.idMeal}-step-${i}`,
            type: 'text',
            L1: `${i + 1}. ${step.trim()}`,
            L2: '',
          });
        });
        
        return {
          id: `page-${meal.idMeal}`,
          number: idx + 1,
          title: meal.strMeal,
          lines,
        };
      });
      
      const firstMeal = meals[0];
      
      return {
        title: meals.length === 1 
          ? firstMeal.strMeal 
          : `Recipe Collection (${meals.length} recipes)`,
        description: meals.length === 1 
          ? `${firstMeal.strCategory} from ${firstMeal.strArea}`
          : 'Delicious recipes for translation',
        sourceLang: 'en',
        layout: 'workbook',
        pages,
        meta: {
          source: 'TheMealDB',
          sourceUrl: 'https://themealdb.com',
          coverImageUrl: firstMeal.strMealThumb,
          publicDomain: true,
          fetchedAt: new Date().toISOString(),
          license: {
            type: 'commercial-safe',
            name: 'Public Domain',
            attributionText: 'Recipes cannot be copyrighted, only specific wording.',
          },
        },
      };
    } catch (error) {
      console.error('TheMealDB adapter error:', error);
      throw error;
    }
  },

  async preview(config: WizardConfig): Promise<Partial<IngestedContent>> {
    try {
      const response = await fetch(`${API_BASE}/random.php`);
      if (!response.ok) throw new Error('Preview failed');
      
      const data: MealResponse = await response.json();
      const meal = data.meals?.[0];
      
      if (!meal) throw new Error('No recipe found');
      
      const ingredients = getIngredients(meal).slice(0, 5);
      
      return {
        title: meal.strMeal,
        description: `${meal.strCategory} • ${meal.strArea}`,
        pages: [{
          id: 'preview',
          lines: [
            {
              id: 'preview-image',
              type: 'image',
              L1: meal.strMealThumb + '/preview',
              L2: '',
            },
            {
              id: 'preview-title',
              type: 'heading',
              L1: meal.strMeal,
              L2: '',
            },
            {
              id: 'preview-ingredients',
              type: 'text',
              L1: `Ingredients: ${ingredients.map(i => i.ingredient).join(', ')}...`,
              L2: '',
            },
          ],
        }],
      };
    } catch (error) {
      console.error('TheMealDB preview error:', error);
      throw error;
    }
  },
};

export default themealdbAdapter;
