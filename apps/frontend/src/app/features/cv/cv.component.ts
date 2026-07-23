import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Experience, Profile, Project, SkillCategory } from '../../models';
import { LanguageService } from '../../core/services/language.service';

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
        <a routerLink="/" class="font-mono text-sm text-slate-500 hover:text-slate-900">← {{ language.t('cv.back') }}</a>
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="language.toggle()"
            class="font-mono text-xs border border-slate-300 rounded-full px-3 py-1 hover:border-slate-900"
          >
            {{ language.lang() === 'es' ? 'EN' : 'ES' }}
          </button>
          <button
            type="button"
            (click)="print()"
            class="px-5 py-2 rounded-md bg-slate-900 text-white font-semibold"
          >
            {{ language.t('cv.download') }}
          </button>
        </div>
      </div>

      @if (profile(); as p) {
        <header class="border-b-2 border-slate-900 pb-4 mb-8">
          <h1 class="text-4xl font-black tracking-tight" style="font-family: var(--font-display)">
            {{ p.name }}
          </h1>
          <p class="font-mono text-sm text-slate-600 mt-2">
            {{ language.pick(p.tagline, p.taglineEn) }} · Guatemala · {{ p.email }}
            @if (p.githubUrl) { · {{ p.githubUrl }} }
          </p>
        </header>

        <p class="text-slate-700 leading-relaxed mb-8">{{ language.pick(p.bio, p.bioEn) }}</p>
      }

      @if (experience().length) {
        <h2 class="font-mono text-xs uppercase tracking-widest text-slate-500 border-t border-slate-300 pt-3 mb-4">{{ language.t('cv.experienceHeading') }}</h2>
        @for (item of experience(); track item.id) {
          <div class="mb-5">
            <div class="flex justify-between items-baseline">
              <h3 class="font-bold" style="font-family: var(--font-display)">{{ language.pick(item.title, item.titleEn) }} — {{ item.organization }}</h3>
              <span class="font-mono text-xs text-slate-500">{{ item.startYear }}–{{ item.endYear ?? language.t('cv.present') }}</span>
            </div>
            <p class="text-sm text-slate-600 mt-1">{{ language.pick(item.description, item.descriptionEn) }}</p>
          </div>
        }
      }

      @if (projects().length) {
        <h2 class="font-mono text-xs uppercase tracking-widest text-slate-500 border-t border-slate-300 pt-3 mb-4 mt-8">{{ language.t('cv.projectsHeading') }}</h2>
        @for (project of projects(); track project.id) {
          <div class="mb-4">
            <h3 class="font-bold" style="font-family: var(--font-display)">{{ project.name }}</h3>
            <p class="text-sm text-slate-600">{{ language.pick(project.description, project.descriptionEn) }}</p>
            <p class="font-mono text-xs text-slate-500 mt-1">{{ project.stack }}</p>
          </div>
        }
      }

      @if (categories().length) {
        <h2 class="font-mono text-xs uppercase tracking-widest text-slate-500 border-t border-slate-300 pt-3 mb-4 mt-8">{{ language.t('cv.skillsHeading') }}</h2>
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
  readonly language = inject(LanguageService);

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
