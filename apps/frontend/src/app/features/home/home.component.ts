import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Profile, SkillCategory } from '../../models';
import { FooterComponent } from './footer.component';
import { HeroComponent } from './hero.component';
import { SkillsSectionComponent } from './skills-section.component';

@Component({
  selector: 'app-home',
  imports: [HeroComponent, SkillsSectionComponent, FooterComponent],
  template: `
    @if (profile(); as p) {
      <app-hero [profile]="p" />
      <app-skills-section [categories]="categories()" />
      <app-footer [profile]="p" />
    } @else if (error()) {
      <div class="min-h-screen flex items-center justify-center text-slate-400">
        No se pudo cargar el contenido. Intenta de nuevo más tarde.
      </div>
    } @else {
      <div class="min-h-screen flex items-center justify-center">
        <div class="gradient-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-2xl font-bold">
          Cargando…
        </div>
      </div>
    }
  `,
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly profile = signal<Profile | null>(null);
  readonly categories = signal<SkillCategory[]>([]);
  readonly error = signal(false);

  ngOnInit(): void {
    this.api.getProfile().subscribe({
      next: (p) => this.profile.set(p),
      error: () => this.error.set(true),
    });
    this.api.getSkills().subscribe({
      next: (c) => this.categories.set(c),
      error: () => this.error.set(true),
    });
  }
}
