import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Post } from '../../../models';

interface PostForm {
  id: number | null;
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
}

const EMPTY: PostForm = { id: null, title: '', excerpt: '', content: '', published: false };

@Component({
  selector: 'app-posts-admin',
  imports: [FormsModule, DatePipe],
  template: `
    <h1 class="text-2xl font-bold mb-6" style="font-family: var(--font-display)">Blog</h1>

    <form (ngSubmit)="save()" class="rounded-2xl border border-navy-700 p-5 mb-8 grid gap-3">
      <p class="font-mono text-xs uppercase tracking-widest text-ink-dim">
        {{ form.id ? 'Editar publicación' : 'Nueva publicación' }}
      </p>
      <input name="title" [(ngModel)]="form.title" placeholder="Título" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      <input name="excerpt" [(ngModel)]="form.excerpt" placeholder="Resumen corto (se muestra en la lista)" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      <textarea name="content" [(ngModel)]="form.content" placeholder="Contenido (párrafos separados por línea en blanco)" rows="10" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 font-mono text-sm"></textarea>
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm text-ink-dim">
          <input type="checkbox" name="published" [(ngModel)]="form.published" /> Publicado
        </label>
        <button type="submit" [disabled]="!form.title.trim()" class="ml-auto rounded-lg bg-accent px-4 py-2 font-semibold text-navy-950 disabled:opacity-50">
          {{ form.id ? 'Guardar cambios' : 'Crear publicación' }}
        </button>
        @if (form.id) {
          <button type="button" (click)="reset()" class="text-sm text-ink-dim hover:text-ink">Cancelar</button>
        }
      </div>
    </form>

    @for (post of posts(); track post.id) {
      <div class="flex items-center gap-3 border-t border-navy-700/60 py-3">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-ink truncate">{{ post.title }}</p>
          <p class="font-mono text-xs" [class]="post.published ? 'font-mono text-xs text-emerald-400' : 'font-mono text-xs text-ink-dim'">
            {{ post.published ? 'Publicado ' + (post.publishedAt | date: 'dd/MM/yyyy') : 'Borrador' }}
            · /blog/{{ post.slug }}
          </p>
        </div>
        <button type="button" (click)="edit(post)" class="text-sm text-accent hover:underline">Editar</button>
        <button type="button" (click)="remove(post)" class="text-sm text-rose-400 hover:text-rose-300">Eliminar</button>
      </div>
    }
    @if (message()) { <p class="mt-4 text-sm text-emerald-400">{{ message() }}</p> }
  `,
})
export class PostsAdminComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly posts = signal<Post[]>([]);
  readonly message = signal('');
  form: PostForm = { ...EMPTY };

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.api.getAllPosts().subscribe((p) => this.posts.set(p));
  }

  private flash(text: string): void {
    this.message.set(text);
    setTimeout(() => this.message.set(''), 2500);
  }

  reset(): void {
    this.form = { ...EMPTY };
  }

  edit(post: Post): void {
    this.form = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      published: post.published,
    };
  }

  save(): void {
    const data = {
      title: this.form.title.trim(),
      excerpt: this.form.excerpt,
      content: this.form.content,
      published: this.form.published,
    };
    const req = this.form.id ? this.api.updatePost(this.form.id, data) : this.api.createPost(data);
    req.subscribe(() => {
      this.reset();
      this.reload();
      this.flash('✓ Guardado');
    });
  }

  remove(post: Post): void {
    if (!confirm(`¿Eliminar "${post.title}"?`)) return;
    this.api.deletePost(post.id).subscribe(() => {
      this.reload();
      this.flash('✓ Eliminado');
    });
  }
}
