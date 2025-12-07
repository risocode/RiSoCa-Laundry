
// pricing-logic-guidance.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing AI-powered guidance on laundry service options and pricing.
 *
 * The flow helps users understand available packages and pricing, ensuring they get the best value.
 * It includes:
 *   - pricingLogicGuidance: The main function to initiate the guidance flow.
 *   - PricingLogicGuidanceInput: The input type for the pricingLogicGuidance function.
 *   - PricingLogicGuidanceOutput: The output type for the pricingLogicGuidance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const PricingLogicGuidanceInputSchema = z.object({
  servicePackage: z.string().describe('The service package selected by the user (e.g., package1, package2).'),
  weight: z.number().optional().describe('The weight of the laundry in kilograms.'),
  distance: z.number().describe('The distance for pickup and/or delivery, in kilometers.'),
});
export type PricingLogicGuidanceInput = z.infer<typeof PricingLogicGuidanceInputSchema>;

// Define the output schema
const PricingLogicGuidanceOutputSchema = z.object({
  isValidCombination: z
    .boolean()
    .describe('Whether the selected service combination is valid or not. All combinations are valid, so this should be true.'),
  suggestedServices: z
    .array(z.string())
    .describe('AI-powered suggestions for service options.'),
  computedPrice: z.number().describe('The computed price in Philippine Peso (PHP).'),
  invalidServiceChoices: z
    .array(z.string())
    .optional()
    .describe('Flags for invalid service choices, if any.'),
});
export type PricingLogicGuidanceOutput = z.infer<typeof PricingLogicGuidanceOutputSchema>;

// Define the main function
export async function pricingLogicGuidance(input: PricingLogicGuidanceInput): Promise<PricingLogicGuidanceOutput> {
  // If weight is not provided, default to 1 for calculation
  const safeInput = { ...input, weight: input.weight ?? 1 };
  return pricingLogicGuidanceFlow(safeInput);
}

// Define the prompt
const pricingLogicGuidancePrompt = ai.definePrompt({
  name: 'pricingLogicGuidancePrompt',
  input: {schema: PricingLogicGuidanceInputSchema},
  output: {schema: PricingLogicGuidanceOutputSchema},
  prompt: `You are an AI assistant for a laundry service, designed to calculate the price of an order in Philippine Pesos (PHP).

  Here is the pricing structure:
  - Package 1 (Wash, Dry, Fold): ₱180 per kg. Minimum weight is 7.5kg. If weight is less than 7.5kg, calculate as 7.5kg.
  - Transport Fee: ₱10 per kilometer. The first 1km is free.

  Packages:
  - Package 1: Base service only. No transport.
  - Package 2: One-Way Transport. Includes either Pick Up or Delivery.
  - Package 3: All-In. Includes both Pick Up and Delivery.

  User Selections:
  - Package: {{{servicePackage}}}
  - Weight (kg): {{{weight}}}
  - Distance: {{{distance}}} km

  Tasks:
  1.  **isValidCombination**: This is always true.
  2.  **computedPrice**: Calculate the total price in PHP.
      - Base Cost: Use a minimum of 7.5kg. Calculate \`max(7.5, {{{weight}}}) * 180\`.
      - Transport Distance: Calculate \`max(0, {{{distance}}} - 1)\`.
      - For Package 2, add a one-way transport fee: \`max(0, {{{distance}}} - 1) * 10\`.
      - For Package 3, add a two-way transport fee: \`max(0, {{{distance}}} - 1) * 10 * 2\`.
      - Sum the costs to get the final price.
  3.  **suggestedServices**: If the user selects Package 2, suggest Package 3 as a convenient "All-In" option. If they choose Package 1 with a distance > 0, suggest a package with delivery. Otherwise, provide an empty array.
  4.  **invalidServiceChoices**: This should be an empty array.

  Provide only the JSON output.
`,
});

// Define the flow
const pricingLogicGuidanceFlow = ai.defineFlow(
  {
    name: 'pricingLogicGuidanceFlow',
    inputSchema: z.object({
        servicePackage: z.string(),
        weight: z.number(),
        distance: z.number(),
    }),
    outputSchema: PricingLogicGuidanceOutputSchema,
  },
  async input => {
    const {output} = await pricingLogicGuidancePrompt(input);
    return output!;
  }
);

