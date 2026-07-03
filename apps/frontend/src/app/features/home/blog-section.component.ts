import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Post } from '../../models';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-blog-section',
  imports: [RouterLink, DatePipe, RevealDirective],
  template: `
    @if (posts().length) {
      <section id="blog" class="max-w-4xl mx-auto px-6 py-12">
        <div class="flex items-baseline justify-between mb-12">
          <h2
            class="font-bold text-ink text-2xl tracking-tight"
            style="font-family: var(--font-display)"
          >
            Blog
          </h2>
          <a routerLink="/blog" class="font-mono text-sm text-accent hover:underline">Ver todo →</a>
        </div>

        <div class="space-y-6">
          @for (post of posts().slice(0, 3); track post.id) {
            <a
              appReveal
              [routerLink]="['/blog', post.slug]"
              class="block border-t border-navy-700 pt-5 group"
            >
              <p class="font-mono text-xs text-ink-dim mb-1">{{ post.publishedAt | date: 'dd MMM yyyy' }}</p>
              <h3 class="font-bold text-ink group-hover:text-accent transition-colors" style="font-family: var(--font-display)">
                {{ post.title }}
              </h3>
              <p class="text-sm text-ink-dim mt-1 max-w-2xl">{{ post.excerpt }}</p>
            </a>
          }
        </div>
      </section>
    }
  `,
})
export class BlogSectionComponent {
  readonly posts = input.required<Post[]>();
}
