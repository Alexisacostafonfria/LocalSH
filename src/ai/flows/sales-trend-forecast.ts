'use server';

/**
 * @fileOverview A sales trend forecasting AI agent.
 *
 * - salesTrendForecast - A function that handles the sales trend forecast process.
 * - SalesTrendForecastInput - The input type for the salesTrendForecast function.
 * - SalesTrendForecastOutput - The return type for the salesTrendForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SalesDataSchema = z.object({
  date: z.string().describe('The date of the sales record (YYYY-MM-DD).'),
  salesVolume: z.number().describe('The number of sales for the date.'),
});

const SalesTrendForecastInputSchema = z.object({
  salesData: z.array(SalesDataSchema).describe('Historical sales data.'),
});
export type SalesTrendForecastInput = z.infer<typeof SalesTrendForecastInputSchema>;

const SalesTrendForecastOutputSchema = z.object({
  forecast: z.string().describe('A description of predicted sales trends.'),
  confidence: z.string().describe('The confidence level of the forecast.'),
  recommendations: z.string().describe('Recommendations for inventory management.'),
});
export type SalesTrendForecastOutput = z.infer<typeof SalesTrendForecastOutputSchema>;

export async function salesTrendForecast(input: SalesTrendForecastInput): Promise<SalesTrendForecastOutput> {
  return salesTrendForecastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'salesTrendForecastPrompt',
  input: {schema: SalesTrendForecastInputSchema},
  output: {schema: SalesTrendForecastOutputSchema},
  prompt: `You are an expert sales analyst. Analyze the provided sales data to predict future sales trends and provide inventory management recommendations.

Sales Data:
{{#each salesData}}
  Date: {{this.date}}, Sales Volume: {{this.salesVolume}}
{{/each}}

Consider the amount of data available when making your prediction. If there is limited data, provide a more conservative forecast and indicate a lower confidence level.

Output the forecast, confidence level, and recommendations in a clear and concise manner.
`,
});

const salesTrendForecastFlow = ai.defineFlow(
  {
    name: 'salesTrendForecastFlow',
    inputSchema: SalesTrendForecastInputSchema,
    outputSchema: SalesTrendForecastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
