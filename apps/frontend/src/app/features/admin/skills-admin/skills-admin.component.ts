import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { GRADIENT_CLASSES, Skill, SkillCategory } from '../../../models';

interface SkillDraft {
  name: string;
  level: number;
  icon: string;
  featured: boolean;
  sortOrder: number;
}

@Component({
  selector: 'app-skills-admin',
  imports: [FormsModule],
  template: `
    <h1 class="text-2xl font-bold mb-6" style="font-family: var(--font-display)">Skills</h1>

    <!-- Nueva categoría -->
    <div class="flex gap-2 mb-8 flex-wrap">
      <input
        [(ngModel)]="newCategoryName"
        placeholder="Nueva categoría…"
        class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-fuchsia-400"
      />
      <select
        [(ngModel)]="newCategoryGradient"
        class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100"
      >
        @for (g of gradients; track g) {
          <option [value]="g">{{ g }}</option>
        }
      </select>
      <button
        type="button"
        (click)="addCategory()"
        [disabled]="!newCategoryName.trim()"
        class="rounded-lg bg-accent px-4 py-2 font-semibold text-navy-950 disabled:opacity-50"
      >
        + Categoría
      </button>
    </div>

    @for (category of categories(); track category.id) {
      <section class="mb-10 rounded-2xl border border-slate-800 p-5">
        <div class="flex items-center gap-3 mb-4 flex-wrap">
          <span
            [class]="'inline-block w-4 h-4 rounded-full bg-gradient-to-r ' + gradientClass(category.gradient)"
          ></span>
          <input
            [ngModel]="category.name"
            (ngModelChange)="renameCategory(category, $event)"
            class="bg-transparent font-bold text-lg text-slate-100 border-b border-transparent focus:border-slate-600 focus:outline-none"
          />
          <select
            [ngModel]="category.gradient"
            (ngModelChange)="recolorCategory(category, $event)"
            class="rounded-lg bg-slate-900 border border-slate-800 px-2 py-1 text-sm text-slate-300"
          >
            @for (g of gradients; track g) {
              <option [value]="g">{{ g }}</option>
            }
          </select>
          <button
            type="button"
            (click)="removeCategory(category)"
            class="ml-auto text-sm text-rose-400 hover:text-rose-300"
          >
            Eliminar categoría
          </button>
        </div>

        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-slate-500">
              <th class="py-1 pr-2">Skill</th>
              <th class="py-1 pr-2 w-24">Nivel</th>
              <th class="py-1 pr-2 w-32">Ícono</th>
              <th class="py-1 pr-2 w-16">Orden</th>
              <th class="py-1 pr-2 w-10">★</th>
              <th class="w-16"></th>
            </tr>
          </thead>
          <tbody>
            @for (skill of category.skills; track skill.id) {
              <tr class="border-t border-slate-800/60">
                <td class="py-2 pr-2">
                  <input
                    [ngModel]="skill.name"
                    (change)="patchSkill(skill, { name: $any($event.target).value })"
                    class="w-full bg-transparent text-slate-100 focus:outline-none"
                  />
                </td>
                <td class="pr-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    [ngModel]="skill.level"
                    (change)="patchSkill(skill, { level: +$any($event.target).value })"
                    class="w-20 rounded bg-slate-900 border border-slate-800 px-2 py-1 text-slate-100"
                  />
                </td>
                <td class="pr-2">
                  <input
                    [ngModel]="skill.icon ?? ''"
                    (change)="patchSkill(skill, { icon: $any($event.target).value })"
                    class="w-full rounded bg-slate-900 border border-slate-800 px-2 py-1 text-slate-100"
                  />
                </td>
                <td class="pr-2">
                  <input
                    type="number"
                    [ngModel]="skill.sortOrder"
                    (change)="patchSkill(skill, { sortOrder: +$any($event.target).value })"
                    class="w-14 rounded bg-slate-900 border border-slate-800 px-2 py-1 text-slate-100"
                  />
                </td>
                <td class="pr-2">
                  <input
                    type="checkbox"
                    [ngModel]="skill.featured"
                    (change)="patchSkill(skill, { featured: $any($event.target).checked })"
                  />
                </td>
                <td class="text-right">
                  <button
                    type="button"
                    (click)="removeSkill(skill)"
                    class="text-rose-400 hover:text-rose-300"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>

        <div class="mt-3 flex gap-2 flex-wrap items-center">
          <input
            [(ngModel)]="drafts[category.id].name"
            placeholder="Nueva skill…"
            class="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-slate-100 focus:outline-none focus:border-fuchsia-400"
          />
          <input
            [(ngModel)]="drafts[category.id].icon"
            placeholder="ícono (ej: angular)"
            class="w-40 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-slate-100"
          />
          <input
            type="number"
            min="0"
            max="100"
            [(ngModel)]="drafts[category.id].level"
            class="w-20 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-slate-100"
          />
          <button
            type="button"
            (click)="addSkill(category)"
            [disabled]="!drafts[category.id].name.trim()"
            class="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-fuchsia-400 disabled:opacity-50"
          >
            + Skill
          </button>
        </div>
      </section>
    }

    @if (message()) {
      <p class="text-sm text-emerald-400">{{ message() }}</p>
    }
  `,
})
export class SkillsAdminComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly categories = signal<SkillCategory[]>([]);
  readonly message = signal('');
  readonly gradients = Object.keys(GRADIENT_CLASSES);

  newCategoryName = '';
  newCategoryGradient = 'violet';
  drafts: Record<number, SkillDraft> = {};

  ngOnInit(): void {
    this.reload();
  }

  gradientClass(gradient: string): string {
    return GRADIENT_CLASSES[gradient] ?? GRADIENT_CLASSES['violet'];
  }

  private reload(): void {
    this.api.getSkills().subscribe((cats) => {
      this.categories.set(cats);
      for (const cat of cats) {
        this.drafts[cat.id] ??= { name: '', level: 80, icon: '', featured: false, sortOrder: cat.skills.length };
      }
    });
  }

  private flash(text: string): void {
    this.message.set(text);
    setTimeout(() => this.message.set(''), 2500);
  }

  addCategory(): void {
    this.api
      .createCategory({
        name: this.newCategoryName.trim(),
        gradient: this.newCategoryGradient,
        sortOrder: this.categories().length,
      })
      .subscribe(() => {
        this.newCategoryName = '';
        this.reload();
        this.flash('✓ Categoría creada');
      });
  }

  renameCategory(category: SkillCategory, name: string): void {
    if (!name.trim()) return;
    this.api.updateCategory(category.id, { name: name.trim() }).subscribe(() => this.flash('✓ Guardado'));
  }

  recolorCategory(category: SkillCategory, gradient: string): void {
    this.api.updateCategory(category.id, { gradient }).subscribe(() => {
      this.reload();
      this.flash('✓ Guardado');
    });
  }

  removeCategory(category: SkillCategory): void {
    const ok = confirm(
      `¿Eliminar "${category.name}"? Se eliminarán también sus ${category.skills.length} skills.`,
    );
    if (!ok) return;
    this.api.deleteCategory(category.id).subscribe(() => {
      this.reload();
      this.flash('✓ Categoría eliminada');
    });
  }

  addSkill(category: SkillCategory): void {
    const draft = this.drafts[category.id];
    this.api
      .createSkill({
        name: draft.name.trim(),
        level: draft.level,
        icon: draft.icon.trim() || undefined,
        sortOrder: category.skills.length,
        categoryId: category.id,
      })
      .subscribe(() => {
        this.drafts[category.id] = { name: '', level: 80, icon: '', featured: false, sortOrder: 0 };
        this.reload();
        this.flash('✓ Skill creada');
      });
  }

  patchSkill(skill: Skill, data: Partial<Skill>): void {
    this.api.updateSkill(skill.id, data).subscribe(() => {
      this.reload();
      this.flash('✓ Guardado');
    });
  }

  removeSkill(skill: Skill): void {
    if (!confirm(`¿Eliminar "${skill.name}"?`)) return;
    this.api.deleteSkill(skill.id).subscribe(() => {
      this.reload();
      this.flash('✓ Skill eliminada');
    });
  }
}
