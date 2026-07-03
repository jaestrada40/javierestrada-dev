import { Component, input } from '@angular/core';
import { Profile } from '../../models';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="max-w-4xl mx-auto px-6 py-12">
      <div class="border-t border-navy-700 pt-6 flex flex-wrap items-center justify-between gap-4">
        <p class="font-mono text-sm text-ink-dim">javierestrada.dev · {{ year }}</p>
        <div class="flex gap-6 font-mono text-sm text-ink-dim">
          @if (profile().githubUrl) {
            <a [href]="profile().githubUrl" target="_blank" rel="noopener" class="hover:text-accent transition-colors">GitHub</a>
          }
          @if (profile().linkedinUrl) {
            <a [href]="profile().linkedinUrl" target="_blank" rel="noopener" class="hover:text-accent transition-colors">LinkedIn</a>
          }
          <a [href]="'mailto:' + profile().email" class="hover:text-accent transition-colors">Email</a>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly profile = input.required<Profile>();
  readonly year = new Date().getFullYear();
}
