import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TranslateService } from './translate.service';

describe('TranslateService', () => {
  let service: TranslateService;
  const config = { getOrThrow: jest.fn().mockReturnValue('fake-deepl-key') };
  const originalFetch = global.fetch;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [TranslateService, { provide: ConfigService, useValue: config }],
    }).compile();
    service = module.get(TranslateService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('devuelve el texto traducido que responde DeepL', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ translations: [{ text: 'Hello world' }] }),
    }) as unknown as typeof fetch;

    const result = await service.translate('Hola mundo');

    expect(result).toBe('Hello world');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api-free.deepl.com/v2/translate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('lanza un error si DeepL responde con fallo', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 456,
      text: () => Promise.resolve('Quota exceeded'),
    }) as unknown as typeof fetch;

    await expect(service.translate('Hola mundo')).rejects.toThrow();
  });
});
