import { Test, TestingModule } from '@nestjs/testing';
import { AiServiceService } from './ai-service.service';
import { AiRateLimiter } from './rate-limiter';
import * as GoogleGenAIModule from '@google/genai';
import * as OpenAIModule from 'openai';
import * as AnthropicModule from '@anthropic-ai/sdk';
import { Logger } from '@nestjs/common';

// Mock the AI SDKs
jest.mock('@google/genai');
jest.mock('openai');
jest.mock('@anthropic-ai/sdk');

// Mock buildPrompt
jest.mock('./prompt-builder', () => ({
  buildPrompt: jest.fn().mockReturnValue('mock-prompt'),
}));

describe('AiServiceService', () => {
  let service: AiServiceService;
  let rateLimiter: AiRateLimiter;
  
  const mockGeminiGenerateContent = jest.fn();
  const mockOpenAICreate = jest.fn();
  const mockAnthropicCreate = jest.fn();

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Save original env vars
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'test-gemini-key',
      OPENAI_API_KEY: 'test-openai-key',
      ANTHROPIC_API_KEY: 'test-anthropic-key',
    };

    // Setup SDK mocks
    (GoogleGenAIModule.GoogleGenAI as jest.Mock).mockImplementation(() => ({
      models: { generateContent: mockGeminiGenerateContent }
    }));

    (OpenAIModule.default as unknown as jest.Mock).mockImplementation(() => ({
      chat: { completions: { create: mockOpenAICreate } }
    }));

    (AnthropicModule.default as unknown as jest.Mock).mockImplementation(() => ({
      messages: { create: mockAnthropicCreate }
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiServiceService,
        {
          provide: AiRateLimiter,
          useValue: {
            waitForToken: jest.fn().mockResolvedValue(undefined),
            releaseToken: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiServiceService>(AiServiceService);
    rateLimiter = module.get<AiRateLimiter>(AiRateLimiter);
    
    // Disable logger output for tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    
    // Mock setTimeout to run immediately in tests
    jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
      cb();
      return {} as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should acquire and release rate limiter token', async () => {
    mockGeminiGenerateContent.mockResolvedValue({ text: '{"success": true}' });
    
    await service.generateSummary({});
    
    expect(rateLimiter.waitForToken).toHaveBeenCalledTimes(1);
    expect(rateLimiter.releaseToken).toHaveBeenCalledTimes(1);
  });

  it('should call gemini successfully on first try', async () => {
    mockGeminiGenerateContent.mockResolvedValue({ text: '{"success": true, "provider": "gemini"}' });
    
    const result = await service.generateSummary({});
    
    expect(mockGeminiGenerateContent).toHaveBeenCalledTimes(1);
    expect(mockOpenAICreate).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, provider: 'gemini' });
  });

  it('should retry gemini on 429 and eventually succeed', async () => {
    const error429 = new Error('Rate limit exceeded');
    (error429 as any).status = 429;
    
    mockGeminiGenerateContent
      .mockRejectedValueOnce(error429)
      .mockRejectedValueOnce(error429)
      .mockResolvedValueOnce({ text: '{"success": true}' });
      
    const result = await service.generateSummary({});
    
    expect(mockGeminiGenerateContent).toHaveBeenCalledTimes(3);
    expect(mockOpenAICreate).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
    expect(global.setTimeout).toHaveBeenCalledTimes(2);
  });

  it('should fall back to openai if gemini hits 429s max retries', async () => {
    const error429 = new Error('Rate limit exceeded');
    (error429 as any).status = 429;
    
    // Gemini fails 3 times
    mockGeminiGenerateContent.mockRejectedValue(error429);
    // OpenAI succeeds on 1st try
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: '{"success": true, "provider": "openai"}' } }]
    });
      
    const result = await service.generateSummary({});
    
    expect(mockGeminiGenerateContent).toHaveBeenCalledTimes(3);
    expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, provider: 'openai' });
  });

  it('should fall back immediately to openai on non-429 error', async () => {
    // Gemini throws 500
    mockGeminiGenerateContent.mockRejectedValue(new Error('Internal server error'));
    // OpenAI succeeds
    mockOpenAICreate.mockResolvedValue({
      choices: [{ message: { content: '{"success": true, "provider": "openai"}' } }]
    });
      
    const result = await service.generateSummary({});
    
    expect(mockGeminiGenerateContent).toHaveBeenCalledTimes(1); // No retries for 500
    expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, provider: 'openai' });
  });

  it('should fall back to anthropic if gemini and openai fail', async () => {
    mockGeminiGenerateContent.mockRejectedValue(new Error('Gemini failed'));
    mockOpenAICreate.mockRejectedValue(new Error('OpenAI failed'));
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: '{"success": true, "provider": "anthropic"}' }]
    });
      
    const result = await service.generateSummary({});
    
    expect(mockGeminiGenerateContent).toHaveBeenCalledTimes(1);
    expect(mockOpenAICreate).toHaveBeenCalledTimes(1);
    expect(mockAnthropicCreate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ success: true, provider: 'anthropic' });
  });

  it('should return fallback response if all providers fail', async () => {
    mockGeminiGenerateContent.mockRejectedValue(new Error('Gemini failed'));
    mockOpenAICreate.mockRejectedValue(new Error('OpenAI failed'));
    mockAnthropicCreate.mockRejectedValue(new Error('Anthropic failed'));
      
    const result = await service.generateSummary({});
    
    expect(result.executiveSummary).toEqual('All AI providers failed');
  });

  it('should release token even if everything fails', async () => {
    mockGeminiGenerateContent.mockRejectedValue(new Error('Gemini failed'));
    mockOpenAICreate.mockRejectedValue(new Error('OpenAI failed'));
    mockAnthropicCreate.mockRejectedValue(new Error('Anthropic failed'));
      
    await service.generateSummary({});
    
    expect(rateLimiter.waitForToken).toHaveBeenCalledTimes(1);
    expect(rateLimiter.releaseToken).toHaveBeenCalledTimes(1);
  });
});