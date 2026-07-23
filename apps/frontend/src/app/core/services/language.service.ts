import { Injectable, signal } from '@angular/core';
import { UI_STRINGS, UiStringKey } from '../i18n/ui-strings';

const STORAGE_KEY = 'lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly _lang = signal<'es' | 'en'>(this.readStored());
  readonly lang = this._lang.asReadonly();

  private readStored(): 'es' | 'en' {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return stored === 'en' ? 'en' : 'es';
  }

  toggle(): void {
    const next = this._lang() === 'es' ? 'en' : 'es';
    this._lang.set(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  pick(es: string, en: string | null | undefined): string {
    return this.lang() === 'en' && en ? en : es;
  }

  t(key: UiStringKey): string {
    return UI_STRINGS[this.lang()][key];
  }
}
