import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Experience } from '../../../models';

interface ExperienceForm {
  id: number | null;
  kind: 'work' | 'education';
  title: string;
  titleEn: string;
  organization: string;
  startYear: number;
  endYear: number | null;
  description: string;
  descriptionEn: string;
  sortOrder: number;
}

const EMPTY: ExperienceForm = {
  id: null, kind: 'work', title: '', titleEn: '', organization: '',
  startYear: new Date().getFullYear(), endYear: null, description: '', descriptionEn: '', sortOrder: 0,
};

@Component({
  selector: 'app-experience-admin',
  imports: [FormsModule],
  template: `
    <h1 class="text-2xl font-bold mb-6" style="font-family: var(--font-display)">Experiencia & Formación</h1>

    <form (ngSubmit)="save()" class="rounded-2xl border border-navy-700 p-5 mb-8 grid gap-3">
      <p class="font-mono text-xs uppercase tracking-widest text-ink-dim">
        {{ form.id ? 'Editar entrada' : 'Nueva entrada' }}
      </p>
      <div class="grid grid-cols-2 gap-3">
        <select name="kind" [(ngModel)]="form.kind" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2">
          <option value="work">Trabajo</option>
          <option value="education">Formación</option>
        </select>
        <input name="organization" [(ngModel)]="form.organization" placeholder="Organización" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      </div>
      <input name="title" [(ngModel)]="form.title" placeholder="Título / puesto / carrera" required class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      <div class="grid grid-cols-2 gap-3">
        <input type="number" name="startYear" [(ngModel)]="form.startYear" placeholder="Año inicio" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
        <input type="number" name="endYear" [(ngModel)]="form.endYear" placeholder="Año fin (vacío = actualidad)" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
      </div>
      <textarea name="description" [(ngModel)]="form.description" placeholder="Descripción" rows="2" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2"></textarea>

      <div class="border-t border-navy-700/60 pt-3 grid gap-2">
        <div class="flex items-center justify-between">
          <p class="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Título (EN)</p>
          <button type="button" (click)="translateTitle()" [disabled]="translating() === 'title'" class="text-xs text-accent hover:underline disabled:opacity-50">
            {{ translating() === 'title' ? 'Traduciendo…' : 'Traducir a inglés' }}
          </button>
        </div>
        <input name="titleEn" [(ngModel)]="form.titleEn" placeholder="Title / role / degree" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2" />
        <div class="flex items-center justify-between">
          <p class="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Descripción (EN)</p>
          <button type="button" (click)="translateDescription()" [disabled]="translating() === 'description'" class="text-xs text-accent hover:underline disabled:opacity-50">
            {{ translating() === 'description' ? 'Traduciendo…' : 'Traducir a inglés' }}
          </button>
        </div>
        <textarea name="descriptionEn" [(ngModel)]="form.descriptionEn" placeholder="Description" rows="2" class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2"></textarea>
        @if (translateError()) { <p class="text-sm text-rose-400">{{ translateError() }}</p> }
      </div>

      <div class="flex items-center gap-4">
        <button type="submit" [disabled]="!form.title.trim() || !form.organization.trim()" class="rounded-lg bg-accent px-4 py-2 font-semibold text-navy-950 disabled:opacity-50">
          {{ form.id ? 'Guardar cambios' : 'Agregar' }}
        </button>
        @if (form.id) {
          <button type="button" (click)="reset()" class="text-sm text-ink-dim hover:text-ink">Cancelar</button>
        }
      </div>
    </form>

    @for (item of items(); track item.id) {
      <div class="flex items-center gap-3 border-t border-navy-700/60 py-3">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-ink">{{ item.title }} — {{ item.organization }}</p>
          <p class="font-mono text-xs text-ink-dim">
            {{ item.kind === 'education' ? 'Formación' : 'Trabajo' }} · {{ item.startYear }}–{{ item.endYear ?? 'actualidad' }}
          </p>
        </div>
        <button type="button" (click)="edit(item)" class="text-sm text-accent hover:underline">Editar</button>
        <button type="button" (click)="remove(item)" class="text-sm text-rose-400 hover:text-rose-300">Eliminar</button>
      </div>
    }
    @if (message()) { <p class="mt-4 text-sm text-emerald-400">{{ message() }}</p> }
  `,
})
export class ExperienceAdminComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly items = signal<Experience[]>([]);
  readonly message = signal('');
  readonly translating = signal<'title' | 'description' | null>(null);
  readonly translateError = signal('');
  form: ExperienceForm = { ...EMPTY };

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    this.api.getExperience().subscribe((e) => this.items.set(e));
  }

  private flash(text: string): void {
    this.message.set(text);
    setTimeout(() => this.message.set(''), 2500);
  }

  reset(): void {
    this.form = { ...EMPTY };
  }

  edit(item: Experience): void {
    this.form = { ...item, titleEn: item.titleEn ?? '', descriptionEn: item.descriptionEn ?? '' };
  }

  translateTitle(): void {
    if (this.translating()) return;
    const text = this.form.title.trim();
    if (!text) return;
    this.translating.set('title');
    this.translateError.set('');
    this.api.translate(text).subscribe({
      next: ({ translated }) => {
        this.form.titleEn = translated;
        this.translating.set(null);
      },
      error: () => {
        this.translating.set(null);
        this.translateError.set('No se pudo traducir, inténtalo de nuevo.');
      },
    });
  }

  translateDescription(): void {
    if (this.translating()) return;
    const text = this.form.description.trim();
    if (!text) return;
    this.translating.set('description');
    this.translateError.set('');
    this.api.translate(text).subscribe({
      next: ({ translated }) => {
        this.form.descriptionEn = translated;
        this.translating.set(null);
      },
      error: () => {
        this.translating.set(null);
        this.translateError.set('No se pudo traducir, inténtalo de nuevo.');
      },
    });
  }

  save(): void {
    const data = {
      kind: this.form.kind,
      title: this.form.title.trim(),
      titleEn: this.form.titleEn.trim() || undefined,
      organization: this.form.organization.trim(),
      startYear: Number(this.form.startYear),
      endYear: this.form.endYear ? Number(this.form.endYear) : undefined,
      description: this.form.description,
      descriptionEn: this.form.descriptionEn.trim() || undefined,
      sortOrder: this.form.sortOrder,
    };
    const req = this.form.id
      ? this.api.updateExperience(this.form.id, data as Partial<Experience>)
      : this.api.createExperience(data);
    req.subscribe(() => {
      this.reset();
      this.reload();
      this.flash('✓ Guardado');
    });
  }

  remove(item: Experience): void {
    if (!confirm(`¿Eliminar "${item.title}"?`)) return;
    this.api.deleteExperience(item.id).subscribe(() => {
      this.reload();
      this.flash('✓ Eliminado');
    });
  }
}
