import { Component, input } from '@angular/core';
import { Profile } from '../../models';

@Component({
  selector: 'app-hero',
  template: `
    <header class="max-w-4xl mx-auto px-6 pt-24 pb-16">
      <p class="font-mono text-sm text-ink-dim tracking-widest uppercase mb-6">
        Perfil profesional
      </p>

      <h1
        class="font-black text-ink leading-none tracking-tight"
        style="font-family: var(--font-display); font-size: clamp(2.8rem, 8vw, 5.5rem)"
      >
        {{ profile().name }}
      </h1>

      <!-- Doble filete de membrete -->
      <div class="mt-8 border-t-2 border-navy-700"></div>
      <div class="mt-1 border-t border-navy-700"></div>

      <div class="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-mono text-sm text-ink-dim">
        <span class="text-accent">{{ profile().tagline }}</span>
        <span>Guatemala</span>
        <a [href]="'mailto:' + profile().email" class="hover:text-ink transition-colors">
          {{ profile().email }}
        </a>
      </div>

      <p class="mt-10 text-lg text-ink-dim leading-relaxed max-w-2xl">
        {{ profile().bio }}
      </p>

      <div class="mt-10 flex items-center gap-3 flex-wrap">
        @if (profile().githubUrl) {
          <a
            [href]="profile().githubUrl"
            target="_blank"
            rel="noopener"
            class="px-5 py-2.5 rounded-md bg-accent text-navy-950 font-semibold hover:opacity-90 transition-opacity"
          >
            GitHub
          </a>
        }
        @if (profile().linkedinUrl) {
          <a
            [href]="profile().linkedinUrl"
            target="_blank"
            rel="noopener"
            class="px-5 py-2.5 rounded-md border border-navy-700 text-ink font-semibold hover:border-accent hover:text-accent transition-colors"
          >
            LinkedIn
          </a>
        }
        <a
          [href]="'mailto:' + profile().email"
          class="px-5 py-2.5 rounded-md border border-navy-700 text-ink font-semibold hover:border-accent hover:text-accent transition-colors"
        >
          Contacto
        </a>
      </div>
    </header>
  `,
})
export class HeroComponent {
  readonly profile = input.required<Profile>();
}
