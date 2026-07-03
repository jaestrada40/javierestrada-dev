import { Component, input } from '@angular/core';
import { GRADIENT_CLASSES, SkillCategory } from '../../models';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-skills-section',
  imports: [RevealDirective],
  template: `
    <section id="skills" class="relative max-w-6xl mx-auto px-6 py-24">
      <h2
        class="text-center font-black mb-20"
        style="font-family: var(--font-display); font-size: clamp(2.2rem, 6vw, 4rem)"
      >
        <span class="gradient-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300">
          Skills & Tecnologías
        </span>
      </h2>

      @for (category of categories(); track category.id) {
        <div class="mb-20" appReveal>
          <h3
            class="text-2xl md:text-3xl font-bold mb-8 inline-block gradient-text bg-gradient-to-r"
            [class]="'text-2xl md:text-3xl font-bold mb-8 inline-block gradient-text bg-gradient-to-r ' + gradientClass(category.gradient)"
            style="font-family: var(--font-display)"
          >
            {{ category.name }}
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            @for (skill of category.skills; track skill.id) {
              <div
                class="group relative rounded-2xl bg-slate-900/80 border border-slate-800 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-slate-600 hover:shadow-xl"
              >
                <div
                  class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-15 transition-opacity bg-gradient-to-br pointer-events-none"
                  [class]="'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-15 transition-opacity bg-gradient-to-br pointer-events-none ' + gradientClass(category.gradient)"
                ></div>

                <div class="flex items-center gap-4 mb-4">
                  @if (skill.icon) {
                    <i [class]="'devicon-' + skill.icon + '-plain colored text-4xl'"></i>
                  }
                  <div>
                    <p class="font-semibold text-lg text-slate-100">{{ skill.name }}</p>
                    @if (skill.featured) {
                      <span class="text-xs font-medium text-amber-300">★ Destacada</span>
                    }
                  </div>
                  <span class="ml-auto text-sm font-mono text-slate-400">{{ skill.level }}%</span>
                </div>

                <div class="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-gradient-to-r transition-all duration-1000"
                    [class]="'h-full rounded-full bg-gradient-to-r transition-all duration-1000 ' + gradientClass(category.gradient)"
                    [style.width.%]="skill.level"
                  ></div>
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

  gradientClass(gradient: string): string {
    return GRADIENT_CLASSES[gradient] ?? GRADIENT_CLASSES['violet'];
  }
}
