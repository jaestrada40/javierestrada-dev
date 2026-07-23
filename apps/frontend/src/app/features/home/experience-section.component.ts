import { Component, inject, input } from '@angular/core';
import { Experience } from '../../models';
import { RevealDirective } from '../../shared/reveal.directive';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-experience-section',
  imports: [RevealDirective],
  template: `
    @if (items().length) {
      <section id="experiencia" class="max-w-6xl mx-auto px-6 py-16">
        <h2
          class="font-bold text-ink text-3xl mb-12 tracking-tight"
          style="font-family: var(--font-display)"
        >
          {{ language.t('experience.heading') }}
        </h2>

        <div class="border-l border-navy-700 pl-8 space-y-10">
          @for (item of items(); track item.id) {
            <div appReveal class="relative">
              <span class="absolute -left-[37px] top-1.5 w-2.5 h-2.5 rounded-full bg-accent"></span>
              <p class="font-mono text-xs uppercase tracking-widest text-ink-dim mb-1">
                {{ item.startYear }}–{{ item.endYear ?? language.t('experience.present') }} ·
                {{ item.kind === 'education' ? language.t('experience.education') : language.t('experience.work') }}
              </p>
              <h3 class="font-bold text-ink" style="font-family: var(--font-display)">
                {{ language.pick(item.title, item.titleEn) }}
              </h3>
              <p class="text-sm text-accent mb-2">{{ item.organization }}</p>
              <p class="text-sm text-ink-dim leading-relaxed max-w-2xl">{{ language.pick(item.description, item.descriptionEn) }}</p>
            </div>
          }
        </div>
      </section>
    }
  `,
})
export class ExperienceSectionComponent {
  readonly items = input.required<Experience[]>();
  readonly language = inject(LanguageService);
}
