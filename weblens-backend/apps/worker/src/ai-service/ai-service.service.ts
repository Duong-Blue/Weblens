import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { buildPrompt } from './prompt-builder';

@Injectable()
export class AiServiceService {
  private apiKeys: string[] = [];
  private currentKeyIndex: number = 0;
  private readonly logger = new Logger(AiServiceService.name);

  constructor() {
    this.initApiKeys();
  }

  private initApiKeys() {
    const rawKeys = process.env.GEMINI_API_KEY || 'dummy_key';
    this.apiKeys = rawKeys.split(',').map(key => key.trim()).filter(key => key.length > 0);

    if (this.apiKeys.length === 0 || (this.apiKeys.length === 1 && (this.apiKeys[0] === 'your_gemini_api_key_here' || this.apiKeys[0] === 'dummy_key'))) {
       this.logger.warn('No valid GEMINI_API_KEY provided. Using dummy fallback.');
    } else {
       this.logger.log(`Initialized with ${this.apiKeys.length} Gemini API keys.`);
    }
  }

  private getAiClient(): GoogleGenAI {
    const currentKey = this.apiKeys[this.currentKeyIndex] || 'dummy_key';
    return new GoogleGenAI({ apiKey: currentKey });
  }

  private rotateApiKey() {
    if (this.apiKeys.length <= 1) return false;

    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    this.logger.warn(`Rotated Gemini API key. Now using key index: ${this.currentKeyIndex}`);
    return true;
  }

  async generateSummary(data: any): Promise<any> {
    if (this.apiKeys.length === 0 || (this.apiKeys.length === 1 && (this.apiKeys[0] === 'your_gemini_api_key_here' || this.apiKeys[0] === 'dummy_key'))) {
      this.logger.warn('No valid GEMINI_API_KEY provided. Returning dummy summary.');
      return {
        executiveSummary: 'No summary available (Missing API Key).',
        uiUxAnalysis: {},
        recommendations: [],
        scorecard: {},
        categoryAnalysis: {}
      };
    }

    const prompt = buildPrompt(data);


    let attempts = 0;
    const maxAttempts = this.apiKeys.length;

    while (attempts < maxAttempts) {
      try {
        const ai = this.getAiClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });

        let textResponse = response.text || '{}';
        
        textResponse = textResponse.replace(/^```json/m, '').replace(/^```/m, '').trim();

        try {
           return JSON.parse(textResponse);
        } catch (parseError) {
           this.logger.error('Failed to parse AI response as JSON:', textResponse);
           return {
             executiveSummary: 'Error parsing AI response.',
             uiUxAnalysis: {},
             recommendations: [],
             scorecard: {},
             categoryAnalysis: {}
           };
        }
      } catch (error: any) {
        attempts++;
        this.logger.error(`Error generating summary with Gemini (Key ${this.currentKeyIndex}, Attempt ${attempts}):`, error.message || error);

        if (attempts >= maxAttempts) {
           this.logger.warn('All Gemini keys failed. Attempting fallbacks...');
           
           try {
              if (process.env.OPENAI_API_KEY) {
                 this.logger.log('Falling back to OpenAI...');
                 const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                 const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: 'json_object' }
                 });
                 let textResponse = response.choices[0]?.message?.content || '{}';
                 textResponse = textResponse.replace(/^```json/m, '').replace(/^```/m, '').trim();
                 return JSON.parse(textResponse);
              } else {
                 throw new Error('OPENAI_API_KEY not found');
              }
           } catch (openaiError: any) {
              this.logger.error(`OpenAI fallback failed: ${openaiError.message || openaiError}`);
              
              try {
                 if (process.env.ANTHROPIC_API_KEY) {
                    this.logger.log('Falling back to Anthropic...');
                    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
                    const response = await anthropic.messages.create({
                       model: 'claude-3-5-haiku-latest',
                       max_tokens: 4096,
                       messages: [{ role: 'user', content: prompt }]
                    });
                    
                    let textResponse = '';
                    if (response.content.length > 0 && response.content[0].type === 'text') {
                        textResponse = response.content[0].text;
                    } else {
                        textResponse = '{}';
                    }
                    
                    textResponse = textResponse.replace(/^```json/m, '').replace(/^```/m, '').trim();
                    return JSON.parse(textResponse);
                 } else {
                    throw new Error('ANTHROPIC_API_KEY not found');
                 }
              } catch (anthropicError: any) {
                 this.logger.error(`Anthropic fallback failed: ${anthropicError.message || anthropicError}`);
                 return {
                   executiveSummary: 'All AI providers failed',
                   uiUxAnalysis: {},
                   recommendations: [],
                   scorecard: {},
                   categoryAnalysis: {}
                 };
              }
           }
        }

        this.rotateApiKey();
      }
    }

    return {
      executiveSummary: 'Failed to generate summary.',
      uiUxAnalysis: {},
      recommendations: [],
      scorecard: {},
      categoryAnalysis: {}
    };
  }
}
