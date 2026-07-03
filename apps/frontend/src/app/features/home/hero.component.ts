import { Component, input } from '@angular/core';
import { Profile } from '../../models';

@Component({
  selector: 'app-hero',
  template: `
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      <!-- Blobs de color -->
      <div class="blob w-96 h-96 bg-fuchsia-600 top-[-5rem] left-[-5rem]"></div>
      <div class="blob w-[28rem] h-[28rem] bg-cyan-500 bottom-[-8rem] right-[-6rem]" style="animation-delay: -5s"></div>
      <div class="blob w-72 h-72 bg-amber-400 top-1/3 right-1/4" style="animation-delay: -9s"></div>

      <div class="relative z-10 text-center max-w-5xl">
        <p class="text-lg md:text-xl text-slate-400 mb-4 tracking-widest uppercase">Hola, soy</p>
        <h1
          class="gradient-text bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-amber-300 font-black leading-none"
          style="font-family: var(--font-display); font-size: clamp(3rem, 11vw, 8rem)"
        >
          {{ profile().name }}
        </h1>
        <p class="mt-6 text-xl md:text-3xl font-semibold text-slate-200">
          {{ profile().tagline }}
        </p>
        <p class="mt-4 text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
          {{ profile().bio }}
        </p>

        <div class="mt-10 flex items-center justify-center gap-4 flex-wrap">
          @if (profile().githubUrl) {
            <a
              [href]="profile().githubUrl"
              target="_blank"
              rel="noopener"
              class="px-6 py-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 font-semibold text-white shadow-lg shadow-fuchsia-500/25 hover:scale-105 transition-transform"
            >
              <i class="devicon-github-original mr-2"></i>GitHub
            </a>
          }
          @if (profile().linkedinUrl) {
            <a
              [href]="profile().linkedinUrl"
              target="_blank"
              rel="noopener"
              class="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-white shadow-lg shadow-cyan-500/25 hover:scale-105 transition-transform"
            >
              LinkedIn
            </a>
          }
          <a
            [href]="'mailto:' + profile().email"
            class="px-6 py-3 rounded-full border-2 border-slate-600 font-semibold text-slate-200 hover:border-fuchsia-400 hover:text-fuchsia-300 transition-colors"
          >
            Contáctame
          </a>
        </div>

        <a href="#skills" class="inline-block mt-16 text-slate-500 hover:text-slate-300 transition-colors animate-bounce">
          ▼ Ver skills
        </a>
      </div>
    </section>
  `,
})
export class HeroComponent {
  readonly profile = input.required<Profile>();
}
