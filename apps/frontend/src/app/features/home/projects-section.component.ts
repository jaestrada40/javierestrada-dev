import { Component, input } from '@angular/core';
import { Project } from '../../models';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-projects-section',
  imports: [RevealDirective],
  template: `
    @if (projects().length) {
      <section id="proyectos" class="max-w-6xl mx-auto px-6 py-16">
        <div class="flex items-end justify-between gap-6 mb-10"><div><p class="font-mono text-xs text-accent tracking-[.2em] uppercase mb-3">Trabajo reciente</p><h2 class="font-display font-bold text-3xl tracking-tight">Proyectos seleccionados</h2></div><span class="hidden sm:block font-mono text-xs text-ink-dim">Diseño · Código · Producción</span></div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (project of projects(); track project.id) {
            <article
              appReveal
              class="border border-navy-700 rounded-2xl p-7 bg-white hover:border-accent/60 hover:-translate-y-1 hover:shadow-xl transition flex flex-col min-h-72"
            >
              <div class="flex items-start justify-between gap-3 mb-3">
                <h3 class="font-bold text-lg text-ink" style="font-family: var(--font-display)">
                  {{ project.name }}
                </h3>
                @if (project.featured) {
                  <span class="font-mono text-[10px] uppercase tracking-wider text-accent bg-accent-soft rounded-full px-2.5 py-1 shrink-0">Destacado</span>
                }
              </div>

              <p class="text-ink-dim text-sm leading-relaxed flex-1">{{ project.description }}</p>

              <div class="mt-4 flex flex-wrap gap-2">
                @for (tech of stackList(project); track tech) {
                  <span class="font-mono text-xs text-ink-dim bg-warm rounded-md px-2.5 py-1">{{ tech }}</span>
                }
              </div>

              <div class="mt-5 flex gap-4 font-mono text-sm">
                @if (project.githubUrl) {
                  <a [href]="project.githubUrl" target="_blank" rel="noopener" class="text-accent hover:underline">Código →</a>
                }
                @if (project.demoUrl) {
                  <a [href]="project.demoUrl" target="_blank" rel="noopener" class="text-accent hover:underline">Demo →</a>
                }
              </div>
            </article>
          }
        </div>
      </section>
    }
  `,
})
export class ProjectsSectionComponent {
  readonly projects = input.required<Project[]>();

  stackList(project: Project): string[] {
    return project.stack.split(',').map((s) => s.trim()).filter(Boolean);
  }
}
