import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Profile } from '../../models';

@Component({
  selector: 'app-hero',
  imports: [RouterLink],
  template: `
    <header>
      <nav class="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between border-b border-navy-700">
        <a href="#inicio" class="font-display font-bold text-lg tracking-tight">Javier Estrada<span class="text-accent">.</span></a>
        <div class="hidden md:flex gap-7 text-sm text-ink-dim">
          <a href="#proyectos" class="hover:text-accent">Proyectos</a><a href="#skills" class="hover:text-accent">Tecnologías</a><a href="#certificaciones" class="hover:text-accent">Certificaciones</a><a href="#experiencia" class="hover:text-accent">Experiencia</a>
        </div>
      </nav>
      <div id="inicio" class="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-[1.35fr_.65fr] gap-14 items-center">
        <div>
          <p class="font-mono text-xs text-accent tracking-[.2em] uppercase mb-6">Full-Stack Developer · Guatemala</p>
          <h1 class="font-display font-bold text-ink leading-[.94] tracking-[-.055em] max-w-4xl" style="font-size: clamp(3.2rem, 7.3vw, 6.6rem)">
            Construyo software <span class="text-ink-dim">que trabaja contigo.</span>
          </h1>
          <p class="mt-8 text-lg text-ink-dim leading-relaxed max-w-2xl">{{ profile().bio }}</p>
          <div class="mt-9 flex items-center gap-3 flex-wrap">
        @if (profile().githubUrl) {
          <a
            [href]="profile().githubUrl"
            target="_blank"
            rel="noopener"
            class="px-5 py-3 rounded-lg bg-accent text-white font-semibold hover:brightness-90 transition"
          >
            Ver proyectos
          </a>
        }
        @if (profile().linkedinUrl) {
          <a
            [href]="profile().linkedinUrl"
            target="_blank"
            rel="noopener"
            class="px-5 py-3 rounded-lg border border-navy-700 bg-white text-ink font-semibold hover:border-accent hover:text-accent transition-colors"
          >
            LinkedIn
          </a>
        }
        <a
          [href]="'mailto:' + profile().email"
          class="px-5 py-3 rounded-lg border border-navy-700 bg-white text-ink font-semibold hover:border-accent hover:text-accent transition-colors"
        >
          Contacto
        </a>
        <a
          routerLink="/cv"
          class="px-5 py-3 rounded-lg border border-navy-700 bg-white font-mono text-sm text-ink-dim hover:border-accent hover:text-accent transition-colors"
        >
          Descargar CV
        </a>
          </div>
        </div>
        <div class="justify-self-center md:justify-self-end">
          <div class="w-60 h-60 md:w-72 md:h-72 rounded-full bg-accent-soft p-3 ring-1 ring-navy-700 shadow-[0_24px_70px_rgba(28,70,55,.13)]">
            @if (profile().avatarUrl) {<img [src]="profile().avatarUrl" [alt]="profile().name" class="w-full h-full rounded-full object-cover" />} @else {<div class="w-full h-full rounded-full grid place-items-center font-display text-6xl text-accent">JE</div>}
          </div>
          <p class="font-mono text-xs text-ink-dim text-center mt-5">{{ profile().tagline }}</p>
        </div>
      </div>
    </header>
  `,
})
export class HeroComponent {
  readonly profile = input.required<Profile>();
}
