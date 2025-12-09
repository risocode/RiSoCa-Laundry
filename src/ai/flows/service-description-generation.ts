'use server';

/**
 * @fileOverview AI-powered laundry service description generator.
 *
 * - generateServiceDescription - A function that generates service descriptions based on service names.
 * - ServiceDescriptionInput - The input type for the generateServiceDescription function.
 * - ServiceDescriptionOutput - The return type for the generateServiceDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ServiceDescriptionInputSchema = z.object({
  serviceName: z.string().describe('The name of the laundry service.'),
});

export type ServiceDescriptionInput = z.infer<typeof ServiceDescriptionInputSchema>;

const ServiceDescriptionOutputSchema = z.object({
  description: z.string().describe('A detailed description of the laundry service.'),
});

export type ServiceDescriptionOutput = z.infer<typeof ServiceDescriptionOutputSchema>;

export async function generateServiceDescription(input: ServiceDescriptionInput): Promise<ServiceDescriptionOutput> {
  return generateServiceDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'serviceDescriptionPrompt',
  input: {schema: ServiceDescriptionInputSchema},
  output: {schema: ServiceDescriptionOutputSchema},
  prompt: `You are a helpful assistant that provides detailed descriptions of laundry services.

  Please provide a description for the following laundry service:

  Service Name: {{{serviceName}}}
  `,
});

const generateServiceDescriptionFlow = ai.defineFlow(
  {
    name: 'generateServiceDescriptionFlow',
    inputSchema: ServiceDescriptionInputSchema,
    outputSchema: ServiceDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
