import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Post } from '../../models';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="max-w-4xl mx-auto px-6 py-20">
      <a routerLink="/" class="font-mono text-sm text-ink-dim hover:text-accent">← Inicio</a>
      <h1
        class="font-black text-ink text-4xl mt-6 mb-12 tracking-tight"
        style="font-family: var(--font-display)"
      >
        Blog
      </h1>

      @if (posts().length) {
        <div class="space-y-8">
          @for (post of posts(); track post.id) {
            <a [routerLink]="['/blog', post.slug]" class="block border-t border-navy-700 pt-6 group">
              <p class="font-mono text-xs text-ink-dim mb-1">{{ post.publishedAt | date: 'dd MMM yyyy' }}</p>
              <h2 class="font-bold text-xl text-ink group-hover:text-accent transition-colors" style="font-family: var(--font-display)">
                {{ post.title }}
              </h2>
              <p class="text-ink-dim mt-2 max-w-2xl">{{ post.excerpt }}</p>
            </a>
          }
        </div>
      } @else {
        <p class="text-ink-dim">Todavía no hay publicaciones. Pronto habrá contenido aquí.</p>
      }
    </div>
  `,
})
export class BlogListComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly posts = signal<Post[]>([]);

  ngOnInit(): void {
    this.api.getPosts().subscribe((p) => this.posts.set(p));
  }
}
