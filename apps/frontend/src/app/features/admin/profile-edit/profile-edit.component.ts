import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

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
              class="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-slate-100 focus:outline-none focus:border-fuchsia-400"
            />
          }
        </div>
      }

      <div class="flex items-center gap-4 mt-2">
        <button
          type="submit"
          [disabled]="form.invalid || saving()"
          class="rounded-lg bg-accent px-5 py-2.5 font-semibold text-navy-950 disabled:opacity-50"
        >
          {{ saving() ? 'Guardando…' : 'Guardar' }}
        </button>
        @if (message()) {
          <span class="text-sm text-emerald-400">{{ message() }}</span>
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

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    tagline: ['', Validators.required],
    bio: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    githubUrl: [''],
    linkedinUrl: [''],
    avatarUrl: [''],
  });

  readonly saving = signal(false);
  readonly message = signal('');

  ngOnInit(): void {
    this.api.getProfile().subscribe((p) =>
      this.form.patchValue({
        name: p.name,
        tagline: p.tagline,
        bio: p.bio,
        email: p.email,
        githubUrl: p.githubUrl ?? '',
        linkedinUrl: p.linkedinUrl ?? '',
        avatarUrl: p.avatarUrl ?? '',
      }),
    );
  }

  save(): void {
    this.saving.set(true);
    this.message.set('');
    const v = this.form.getRawValue();
    this.api
      .updateProfile({
        name: v.name,
        tagline: v.tagline,
        bio: v.bio,
        email: v.email,
        githubUrl: v.githubUrl || null,
        linkedinUrl: v.linkedinUrl || null,
        avatarUrl: v.avatarUrl || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.message.set('✓ Guardado');
        },
        error: () => {
          this.saving.set(false);
          this.message.set('Error al guardar');
        },
      });
  }
}
