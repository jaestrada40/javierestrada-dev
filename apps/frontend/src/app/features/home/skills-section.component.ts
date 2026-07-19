import { Component, input } from '@angular/core';
import { SkillCategory } from '../../models';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-skills-section',
  imports: [RevealDirective],
  template: `
    <section id="skills" class="max-w-6xl mx-auto px-6 py-16">
      <h2
        class="font-bold text-ink text-3xl mb-12 tracking-tight"
        style="font-family: var(--font-display)"
      >
        Skills & Tecnologías
      </h2>

      @for (category of categories(); track category.id) {
        <div class="mb-14" appReveal>
          <div class="border-t border-navy-700 pt-3 mb-6">
            <h3 class="font-mono text-xs tracking-[.2em] uppercase text-accent">
              {{ category.name }}
            </h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
            @for (skill of category.skills; track skill.id) {
              <div class="flex items-center gap-4">
                @if (skill.icon) {
                  <i [class]="'devicon-' + skill.icon + '-plain text-2xl text-ink-dim'"></i>
                }
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline justify-between mb-1.5">
                    <p class="font-medium text-ink truncate">
                      {{ skill.name }}
                      @if (skill.featured) {
                        <span class="ml-2 font-mono text-[10px] uppercase tracking-wider text-accent border border-navy-700 rounded px-1.5 py-0.5 align-middle">Principal</span>
                      }
                    </p>
                    <span class="font-mono text-xs text-ink-dim ml-3">{{ skill.level }}</span>
                  </div>
                  <div class="h-px bg-navy-700 relative">
                    <div
                      class="absolute inset-y-0 left-0 h-[3px] -top-[1px] bg-accent transition-all duration-700"
                      [style.width.%]="skill.level"
                    ></div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class SkillsSectionComponent {
  readonly categories = input.required<SkillCategory[]>();
}
