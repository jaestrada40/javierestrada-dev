import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslateService {
  constructor(private readonly config: ConfigService) {}

  async translate(text: string): Promise<string> {
    const apiKey = this.config.getOrThrow<string>('DEEPL_API_KEY');
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [text], source_lang: 'ES', target_lang: 'EN-US' }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new BadGatewayException(`No se pudo traducir: ${detail}`);
    }

    const data = (await response.json()) as { translations: { text: string }[] };
    return data.translations[0].text;
  }
}
