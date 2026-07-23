import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile-edit',
  imports: [ReactiveFormsModule],
  template: `
    <h1 class="text-2xl font-bold mb-6" style="font-family: var(--font-display)">Perfil</h1>

    <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-4">
      @for (field of fields; track field.key) {
        <div>
          <label class="block text-sm text-slate-300 mb-1" [for]="field.key">{{ field.label }}</label>
          @if (field.key === 'bio') {
            <textarea
              [id]="field.key"
              [formControlName]="field.key"
              rows="4"
              class="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-fuchsia-400"
            ></textarea>
          } @else {
            <input
              [id]="field.key"
              [formControlName]="field.key"
              [type]="field.key === 'email' ? 'email' : field.key.includes('Url') ? 'url' : 'text'"
              class="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-fuchsia-400"
            />
          }
        </div>
      }

      <div class="border-t border-slate-800 pt-4 grid gap-4">
        <p class="font-mono text-xs uppercase tracking-widest text-slate-500">Versión en inglés</p>
        @for (field of translatableFields; track field.key) {
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm text-slate-300" [for]="field.enKey">{{ field.label }} (EN)</label>
              <button
                type="button"
                (click)="translateField(field)"
                [disabled]="translating() === field.key"
                class="text-xs text-emerald-400 hover:underline disabled:opacity-50"
              >
                {{ translating() === field.key ? 'Traduciendo…' : 'Traducir a inglés' }}
              </button>
            </div>
            <textarea
              [id]="field.enKey"
              [formControlName]="field.enKey"
              rows="3"
              class="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-fuchsia-400"
            ></textarea>
          </div>
        }
        @if (translateError()) {
          <p class="text-sm text-rose-400">{{ translateError() }}</p>
        }
      </div>

      <div class="flex items-center gap-4 mt-2">
        <button
          type="submit"
          [disabled]="form.invalid || saving()"
          class="rounded-lg bg-accent px-5 py-2.5 font-semibold text-navy-950 disabled:opacity-50"
        >
          {{ saving() ? 'Guardando…' : 'Guardar' }}
        </button>
        @if (message()) {
          <span class="text-sm" [class]="saveError() ? 'text-rose-400' : 'text-emerald-400'">{{ message() }}</span>
        }
      </div>
    </form>
  `,
})
export class ProfileEditComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly fields = [
    { key: 'name', label: 'Nombre' },
    { key: 'tagline', label: 'Tagline' },
    { key: 'bio', label: 'Bio' },
    { key: 'email', label: 'Email' },
    { key: 'githubUrl', label: 'GitHub URL' },
    { key: 'linkedinUrl', label: 'LinkedIn URL' },
    { key: 'avatarUrl', label: 'Avatar URL' },
  ] as const;

  readonly translatableFields = [
    { key: 'tagline' as const, enKey: 'taglineEn' as const, label: 'Tagline' },
    { key: 'bio' as const, enKey: 'bioEn' as const, label: 'Bio' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    tagline: ['', Validators.required],
    taglineEn: [''],
    bio: ['', Validators.required],
    bioEn: [''],
    email: ['', [Validators.required, Validators.email]],
    githubUrl: [''],
    linkedinUrl: [''],
    avatarUrl: [''],
  });

  readonly saving = signal(false);
  readonly message = signal('');
  readonly saveError = signal(false);
  readonly translating = signal<string | null>(null);
  readonly translateError = signal('');

  ngOnInit(): void {
    this.api.getProfile().subscribe((p) =>
      this.form.patchValue({
        name: p.name,
        tagline: p.tagline,
        taglineEn: p.taglineEn ?? '',
        bio: p.bio,
        bioEn: p.bioEn ?? '',
        email: p.email,
        githubUrl: p.githubUrl ?? '',
        linkedinUrl: p.linkedinUrl ?? '',
        avatarUrl: p.avatarUrl ?? '',
      }),
    );
  }

  translateField(field: { key: 'tagline' | 'bio'; enKey: 'taglineEn' | 'bioEn' }): void {
    const text = this.form.controls[field.key].value.trim();
    if (!text) return;
    this.translating.set(field.key);
    this.translateError.set('');
    this.api.translate(text).subscribe({
      next: ({ translated }) => {
        this.form.controls[field.enKey].setValue(translated);
        this.translating.set(null);
      },
      error: () => {
        this.translating.set(null);
        this.translateError.set('No se pudo traducir, inténtalo de nuevo.');
      },
    });
  }

  save(): void {
    this.saving.set(true);
    this.message.set('');
    this.saveError.set(false);
    const v = this.form.getRawValue();
    this.api
      .updateProfile({
        name: v.name,
        tagline: v.tagline,
        taglineEn: v.taglineEn || null,
        bio: v.bio,
        bioEn: v.bioEn || null,
        email: v.email,
        githubUrl: this.normalizeUrl(v.githubUrl),
        linkedinUrl: this.normalizeUrl(v.linkedinUrl),
        avatarUrl: v.avatarUrl || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.message.set('✓ Guardado');
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.saveError.set(true);
          this.message.set(
            error.status === 401
              ? 'Tu sesión expiró. Sal y vuelve a ingresar.'
              : error.status === 400
                ? 'Revisa que los enlaces y el correo tengan un formato válido.'
                : 'No se pudo guardar. Intenta nuevamente.',
          );
        },
      });
  }

  private normalizeUrl(value: string): string | null {
    const normalized = value.trim();
    if (!normalized) return null;
    return /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
  }
}
