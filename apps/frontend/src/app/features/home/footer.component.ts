import { Component, input } from '@angular/core';
import { Profile } from '../../models';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="border-t border-slate-800 py-12 px-6 text-center">
      <p class="text-slate-300 font-semibold text-lg" style="font-family: var(--font-display)">
        {{ profile().name }}
      </p>
      <div class="mt-4 flex justify-center gap-6 text-slate-400">
        @if (profile().githubUrl) {
          <a [href]="profile().githubUrl" target="_blank" rel="noopener" class="hover:text-fuchsia-300 transition-colors">GitHub</a>
        }
        @if (profile().linkedinUrl) {
          <a [href]="profile().linkedinUrl" target="_blank" rel="noopener" class="hover:text-cyan-300 transition-colors">LinkedIn</a>
        }
        <a [href]="'mailto:' + profile().email" class="hover:text-amber-300 transition-colors">{{ profile().email }}</a>
      </div>
      <p class="mt-6 text-sm text-slate-600">javierestrada.dev · {{ year }}</p>
    </footer>
  `,
})
export class FooterComponent {
  readonly profile = input.required<Profile>();
  readonly year = new Date().getFullYear();
}
