import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Project } from '../../../models';

interface ProjectForm {
  id: number | null;
  name: string;
  description: string;
  stack: string;
  githubUrl: string;
  demoUrl: string;
  featured: boolean;
  sortOrder: number;
}

const EMPTY: ProjectForm = {
  id: null, name: '', description: '', stack: '',
  githubUrl: '', demoUrl: '', featured: false, sortOrder: 0,
};

@Component({
  selector: 'app-projects-admin',
  imports: [FormsModule],
  template: `
    <h1 class="text-2xl font-bold mb-6" style="font-family: var(--font-display)">Proyectos</h1>

    <form (ngSubmit)="save()" class="rounded-2xl border border-navy-700 p-5 mb-8 grid gap-3">
      <p class="font-mono text-xs uppercase tracking-widest text-ink-dim">
        {{ form.id ? 'Editar proyecto' : 'Nuevo proyecto' }}
      </p>
      <input name="name" [(ngModel)]="form.name" placeholder="Nombre" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      <textarea name="description" [(ngModel)]="form.description" placeholder="Descripción" rows="3" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2"></textarea>
      <input name="stack" [(ngModel)]="form.stack" placeholder="Stack (separado por comas)" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      <div class="grid grid-cols-2 gap-3">
        <input name="githubUrl" [(ngModel)]="form.githubUrl" placeholder="GitHub URL (opcional)" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
        <input name="demoUrl" [(ngModel)]="form.demoUrl" placeholder="Demo URL (opcional)" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      </div>
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-2 text-sm text-ink-dim">
          <input type="checkbox" name="featured" [(ngModel)]="form.featured" /> Destacado
        </label>
        <label class="flex items-center gap-2 text-sm text-ink-dim">
          Orden
          <input type="number" name="sortOrder" [(ngModel)]="form.sortOrder" class="w-16 rounded bg-slate-900 border border-slate-800 px-2 py-1" />
        </label>
        <button type="submit" [disabled]="!form.name.trim()" class="ml-auto rounded-lg bg-accent px-4 py-2 font-semibold text-navy-950 disabled:opacity-50">
          {{ form.id ? 'Guardar cambios' : 'Crear proyecto' }}
        </button>
        @if (form.id) {
          <button type="button" (click)="reset()" class="text-sm text-ink-dim hover:text-ink">Cancelar</button>
        }
      </div>
    </form>

    @for (project of projects(); track project.id) {
      <div class="flex items-center gap-3 border-t border-navy-700/60 py-3">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-ink">
            {{ project.name }}
            @if (project.featured) { <span class="font-mono text-[10px] text-accent">★</span> }
          </p>
          <p class="text-sm text-ink-dim truncate">{{ project.stack }}</p>
        </div>
        <button type="button" (click)="edit(project)" class="text-sm text-accent hover:underline">Editar</button>
        <button type="button" (click)="remove(project)" class="text-sm text-rose-400 hover:text-rose-300">Eliminar</button>
      </div>
    }
    @if (message()) { <p class="mt-4 text-sm text-emerald-400">{{ message() }}</p> }
  `,
})
export class ProjectsAdminComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly projects = signal<Project[]>([]);
  readonly message = signal('');
  form: ProjectForm = { ...EMPTY };

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.api.getProjects().subscribe((p) => this.projects.set(p));
  }

  private flash(text: string): void {
    this.message.set(text);
    setTimeout(() => this.message.set(''), 2500);
  }

  reset(): void {
    this.form = { ...EMPTY, sortOrder: this.projects().length };
  }

  edit(project: Project): void {
    this.form = {
      id: project.id,
      name: project.name,
      description: project.description,
      stack: project.stack,
      githubUrl: project.githubUrl ?? '',
      demoUrl: project.demoUrl ?? '',
      featured: project.featured,
      sortOrder: project.sortOrder,
    };
  }

  save(): void {
    const data = {
      name: this.form.name.trim(),
      description: this.form.description,
      stack: this.form.stack,
      githubUrl: this.form.githubUrl.trim() || undefined,
      demoUrl: this.form.demoUrl.trim() || undefined,
      featured: this.form.featured,
      sortOrder: this.form.sortOrder,
    };
    const req = this.form.id
      ? this.api.updateProject(this.form.id, data as Partial<Project>)
      : this.api.createProject(data);
    req.subscribe(() => {
      this.reset();
      this.reload();
      this.flash('✓ Guardado');
    });
  }

  remove(project: Project): void {
    if (!confirm(`¿Eliminar "${project.name}"?`)) return;
    this.api.deleteProject(project.id).subscribe(() => {
      this.reload();
      this.flash('✓ Eliminado');
    });
  }
}
