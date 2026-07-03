import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center px-6 bg-slate-950">
      <form
        (ngSubmit)="submit()"
        class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl"
      >
        <h1 class="text-2xl font-bold mb-1" style="font-family: var(--font-display)">Admin</h1>
        <p class="text-sm text-slate-400 mb-6">javierestrada.dev</p>

        <label class="block text-sm text-slate-300 mb-1" for="username">Usuario</label>
        <input
          id="username"
          name="username"
          [(ngModel)]="username"
          required
          autocomplete="username"
          class="w-full mb-4 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-fuchsia-400"
        />

        <label class="block text-sm text-slate-300 mb-1" for="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          [(ngModel)]="password"
          required
          autocomplete="current-password"
          class="w-full mb-6 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-fuchsia-400"
        />

        @if (error()) {
          <p class="text-sm text-rose-400 mb-4">{{ error() }}</p>
        }

        <button
          type="submit"
          [disabled]="loading()"
          class="w-full rounded-lg bg-accent py-2.5 font-semibold text-navy-950 disabled:opacity-50"
        >
          {{ loading() ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal('');

  submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.username, this.password).subscribe({
      next: () => void this.router.navigate(['/admin']),
      error: (err: { status: number }) => {
        this.loading.set(false);
        this.error.set(err.status === 401 ? 'Credenciales inválidas' : 'Error de conexión');
      },
    });
  }
}
