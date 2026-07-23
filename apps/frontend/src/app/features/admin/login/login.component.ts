import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

const MFA_DIGITS = 6;

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="admin-theme min-h-screen flex items-center justify-center px-6 bg-slate-950 text-slate-100">
      <form
        (ngSubmit)="submit()"
        class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl"
      >
        <h1 class="text-2xl font-bold mb-1" style="font-family: var(--font-display)">Admin</h1>
        <p class="text-sm text-slate-400 mb-6">javierestrada.dev</p>

        @if (!mfaRequired()) {
          <label class="block text-sm text-slate-300 mb-1" for="username">Usuario</label>
          <input id="username" name="username" [(ngModel)]="username" required autocomplete="username" class="w-full mb-4 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-400" />
          <label class="block text-sm text-slate-300 mb-1" for="password">Contraseña</label>
          <input id="password" name="password" type="password" [(ngModel)]="password" required autocomplete="current-password" class="w-full mb-6 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-400" />
        } @else {
          <p class="text-sm text-slate-300 mb-4">Ingresa el código de tu aplicación autenticadora o uno de tus códigos de recuperación.</p>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-sm text-slate-300" for="mfaCode0">Código de seguridad</label>
            <span class="text-xs text-slate-500 tabular-nums">Expira en {{ secondsLeft() }}s</span>
          </div>
          <div class="flex gap-2 mb-6">
            @for (digit of digits(); track $index) {
              <input
                #digitInput
                [id]="'mfaCode' + $index"
                name="mfaCode{{ $index }}"
                [value]="digit"
                (input)="onDigitInput($index, $event)"
                (keydown)="onDigitKeydown($index, $event)"
                (paste)="onDigitPaste($event)"
                autocomplete="one-time-code"
                inputmode="numeric"
                maxlength="1"
                [autofocus]="$index === 0"
                class="w-full aspect-square rounded-lg bg-slate-800 border border-slate-700 text-center text-lg text-slate-100 focus:outline-none focus:border-emerald-400"
              />
            }
          </div>
        }

        @if (error()) {
          <p class="text-sm text-rose-400 mb-4">{{ error() }}</p>
        }

        <button
          type="submit"
          [disabled]="loading()"
          class="w-full rounded-lg bg-accent py-2.5 font-semibold text-navy-950 disabled:opacity-50"
        >
          {{ loading() ? 'Verificando…' : mfaRequired() ? 'Verificar' : 'Entrar' }}
        </button>
      </form>
    </div>
  `,
})
export class LoginComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  mfaCode = '';
  private challengeToken = '';
  readonly mfaRequired = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly digits = signal<string[]>(Array(MFA_DIGITS).fill(''));
  readonly secondsLeft = signal(this.computeSecondsLeft());
  private countdownHandle?: ReturnType<typeof setInterval>;

  private computeSecondsLeft(): number {
    return 30 - (Math.floor(Date.now() / 1000) % 30);
  }

  private startCountdown(): void {
    this.stopCountdown();
    this.countdownHandle = setInterval(() => this.secondsLeft.set(this.computeSecondsLeft()), 1000);
  }

  private stopCountdown(): void {
    clearInterval(this.countdownHandle);
    this.countdownHandle = undefined;
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  private syncMfaCode(): void {
    this.mfaCode = this.digits().join('');
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.slice(-1);
    this.digits.update((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
    this.syncMfaCode();
    if (value && index < MFA_DIGITS - 1) {
      const next = input.parentElement?.children[index + 1] as HTMLInputElement | undefined;
      next?.focus();
    }
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits()[index] && index > 0) {
      const input = event.target as HTMLInputElement;
      const prev = input.parentElement?.children[index - 1] as HTMLInputElement | undefined;
      prev?.focus();
    }
  }

  onDigitPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text').trim() ?? '';
    if (!pasted) return;
    event.preventDefault();
    this.mfaCode = pasted;
    this.digits.set(
      Array.from({ length: MFA_DIGITS }, (_, i) => pasted[i] ?? ''),
    );
  }

  submit(): void {
    this.loading.set(true);
    this.error.set('');
    if (this.mfaRequired()) {
      this.auth.verifyMfa(this.challengeToken, this.mfaCode).subscribe({
        next: () => {
          this.stopCountdown();
          void this.router.navigate(['/admin']);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Código inválido o expirado');
        },
      });
      return;
    }
    this.auth.login(this.username, this.password).subscribe({
      next: (result) => {
        if (result.mfaRequired) {
          this.challengeToken = result.challengeToken;
          this.mfaRequired.set(true);
          this.loading.set(false);
          this.password = '';
          this.secondsLeft.set(this.computeSecondsLeft());
          this.startCountdown();
          return;
        }
        void this.router.navigate(['/admin']);
      },
      error: (err: { status: number }) => {
        this.loading.set(false);
        this.error.set(err.status === 401 ? 'Credenciales inválidas' : 'Error de conexión');
      },
    });
  }
}
