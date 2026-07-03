import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Experience, Post, Profile, Project, SkillCategory } from '../../models';
import { BlogSectionComponent } from './blog-section.component';
import { ExperienceSectionComponent } from './experience-section.component';
import { FooterComponent } from './footer.component';
import { HeroComponent } from './hero.component';
import { ProjectsSectionComponent } from './projects-section.component';
import { SkillsSectionComponent } from './skills-section.component';

@Component({
  selector: 'app-home',
  imports: [
    HeroComponent,
    ProjectsSectionComponent,
    SkillsSectionComponent,
    ExperienceSectionComponent,
    BlogSectionComponent,
    FooterComponent,
  ],
  template: `
    @if (profile(); as p) {
      <app-hero [profile]="p" />
      <app-projects-section [projects]="projects()" />
      <app-skills-section [categories]="categories()" />
      <app-experience-section [items]="experience()" />
      <app-blog-section [posts]="posts()" />
      <app-footer [profile]="p" />
    } @else if (error()) {
      <div class="min-h-screen flex items-center justify-center text-ink-dim">
        No se pudo cargar el contenido. Intenta de nuevo más tarde.
      </div>
    } @else {
      <div class="min-h-screen flex items-center justify-center">
        <div class="font-mono text-ink-dim">Cargando…</div>
      </div>
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly profile = signal<Profile | null>(null);
  readonly categories = signal<SkillCategory[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly experience = signal<Experience[]>([]);
  readonly posts = signal<Post[]>([]);
  readonly error = signal(false);

  ngOnInit(): void {
    this.api.getProfile().subscribe({
      next: (p) => this.profile.set(p),
      error: () => this.error.set(true),
    });
    this.api.getSkills().subscribe({ next: (c) => this.categories.set(c) });
    this.api.getProjects().subscribe({ next: (p) => this.projects.set(p) });
    this.api.getExperience().subscribe({ next: (e) => this.experience.set(e) });
    this.api.getPosts().subscribe({ next: (p) => this.posts.set(p) });
  }
}
