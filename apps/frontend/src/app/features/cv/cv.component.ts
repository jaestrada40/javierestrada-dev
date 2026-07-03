import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Experience, Profile, Project, SkillCategory } from '../../models';

@Component({
  selector: 'app-cv',
  imports: [RouterLink],
  styles: [
    `
      @media print {
        .no-print { display: none; }
        :host { color: #111; }
      }
    `,
  ],
  template: `
    <div class="cv-page max-w-3xl mx-auto px-6 py-16 print:py-0 bg-white text-slate-900 min-h-screen">
      <div class="no-print flex justify-between items-center mb-10">
        <a routerLink="/" class="font-mono text-sm text-slate-500 hover:text-slate-900">← Inicio</a>
        <button
          type="button"
          (click)="print()"
          class="px-5 py-2 rounded-md bg-slate-900 text-white font-semibold"
        >
          Descargar PDF
        </button>
      </div>

      @if (profile(); as p) {
        <header class="border-b-2 border-slate-900 pb-4 mb-8">
          <h1 class="text-4xl font-black tracking-tight" style="font-family: var(--font-display)">
            {{ p.name }}
          </h1>
          <p class="font-mono text-sm text-slate-600 mt-2">
            {{ p.tagline }} · Guatemala · {{ p.email }}
            @if (p.githubUrl) { · {{ p.githubUrl }} }
          </p>
        </header>

        <p class="text-slate-700 leading-relaxed mb-8">{{ p.bio }}</p>
      }

      @if (experience().length) {
        <h2 class="font-mono text-xs uppercase tracking-widest text-slate-500 border-t border-slate-300 pt-3 mb-4">Experiencia & Formación</h2>
        @for (item of experience(); track item.id) {
          <div class="mb-5">
            <div class="flex justify-between items-baseline">
              <h3 class="font-bold" style="font-family: var(--font-display)">{{ item.title }} — {{ item.organization }}</h3>
              <span class="font-mono text-xs text-slate-500">{{ item.startYear }}–{{ item.endYear ?? 'actualidad' }}</span>
            </div>
            <p class="text-sm text-slate-600 mt-1">{{ item.description }}</p>
          </div>
        }
      }

      @if (projects().length) {
        <h2 class="font-mono text-xs uppercase tracking-widest text-slate-500 border-t border-slate-300 pt-3 mb-4 mt-8">Proyectos</h2>
        @for (project of projects(); track project.id) {
          <div class="mb-4">
            <h3 class="font-bold" style="font-family: var(--font-display)">{{ project.name }}</h3>
            <p class="text-sm text-slate-600">{{ project.description }}</p>
            <p class="font-mono text-xs text-slate-500 mt-1">{{ project.stack }}</p>
          </div>
        }
      }

      @if (categories().length) {
        <h2 class="font-mono text-xs uppercase tracking-widest text-slate-500 border-t border-slate-300 pt-3 mb-4 mt-8">Skills</h2>
        @for (category of categories(); track category.id) {
          <p class="text-sm mb-1">
            <span class="font-bold">{{ category.name }}:</span>
            <span class="text-slate-600"> {{ skillNames(category) }}</span>
          </p>
        }
      }
    </div>
  `,
})
export class CvComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly profile = signal<Profile | null>(null);
  readonly categories = signal<SkillCategory[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly experience = signal<Experience[]>([]);

  ngOnInit(): void {
    this.api.getProfile().subscribe((p) => this.profile.set(p));
    this.api.getSkills().subscribe((c) => this.categories.set(c));
    this.api.getProjects().subscribe((p) => this.projects.set(p));
    this.api.getExperience().subscribe((e) => this.experience.set(e));
  }

  skillNames(category: SkillCategory): string {
    return category.skills.map((s) => s.name).join(', ');
  }

  print(): void {
    window.print();
  }
}
