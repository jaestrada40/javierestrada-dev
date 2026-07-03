import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Post } from '../../models';

@Component({
  selector: 'app-blog-post',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="max-w-3xl mx-auto px-6 py-20">
      <a routerLink="/blog" class="font-mono text-sm text-ink-dim hover:text-accent">← Blog</a>

      @if (post(); as p) {
        <article class="mt-8">
          <p class="font-mono text-xs text-ink-dim mb-2">{{ p.publishedAt | date: 'dd MMM yyyy' }}</p>
          <h1
            class="font-black text-ink text-3xl md:text-4xl tracking-tight mb-8"
            style="font-family: var(--font-display)"
          >
            {{ p.title }}
          </h1>
          <div class="text-ink-dim leading-relaxed space-y-4">
            @for (paragraph of paragraphs(); track $index) {
              <p>{{ paragraph }}</p>
            }
          </div>
        </article>
      } @else if (notFound()) {
        <p class="mt-8 text-ink-dim">Esta publicación no existe o fue despublicada.</p>
      }
    </div>
  `,
})
export class BlogPostComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  readonly post = signal<Post | null>(null);
  readonly notFound = signal(false);
  readonly paragraphs = signal<string[]>([]);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    this.api.getPost(slug).subscribe({
      next: (p) => {
        this.post.set(p);
        this.paragraphs.set(p.content.split(/\n\s*\n/).filter((s) => s.trim()));
      },
      error: () => this.notFound.set(true),
    });
  }
}
