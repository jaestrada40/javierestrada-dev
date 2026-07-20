import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, MfaSetup } from '../../../core/services/auth.service';

@Component({
  selector: 'app-security',
  imports: [FormsModule],
  template: `
    <section class="max-w-2xl">
      <p class="font-mono text-xs uppercase tracking-widest text-emerald-400 mb-2">Cuenta administrativa</p>
      <h1 class="text-3xl font-bold mb-3" style="font-family: var(--font-display)">Seguridad</h1>
      <p class="text-slate-400 mb-8">Activa la verificación en dos pasos para proteger los cambios de tu portafolio.</p>

      @if (!setup() && !recoveryCodes().length) {
        <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 class="font-semibold text-lg mb-2">Aplicación autenticadora</h2>
          <p class="text-sm text-slate-400 mb-5">Compatible con Google Authenticator, Microsoft Authenticator, Authy y 1Password.</p>
          <button type="button" (click)="startSetup()" [disabled]="loading()" class="rounded-lg bg-accent px-5 py-2.5 font-semibold text-white disabled:opacity-50">{{ loading() ? 'Preparando…' : 'Configurar MFA' }}</button>
        </div>
      }

      @if (setup(); as data) {
        <div class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 class="font-semibold text-lg mb-2">1. Escanea el código QR</h2>
          <p class="text-sm text-slate-400 mb-4">El QR se genera en tu propio servidor y el secreto se guarda cifrado.</p>
          <img [src]="data.qrCode" alt="Código QR para configurar MFA" class="w-56 h-56 rounded-xl bg-white p-2 mb-4" />
          <details class="mb-6"><summary class="text-sm text-slate-300 cursor-pointer">Ingresar clave manualmente</summary><code class="block mt-2 break-all text-xs text-emerald-300">{{ data.secret }}</code></details>
          <h2 class="font-semibold text-lg mb-2">2. Confirma un código</h2>
          <form (ngSubmit)="enable()" class="flex flex-wrap gap-3">
            <input name="code" [(ngModel)]="code" required maxlength="6" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" class="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 tracking-[.25em]" />
            <button type="submit" [disabled]="loading()" class="rounded-lg bg-accent px-5 py-2 font-semibold text-white disabled:opacity-50">Activar MFA</button>
          </form>
        </div>
      }

      @if (recoveryCodes().length) {
        <div class="rounded-2xl border border-amber-600/40 bg-amber-950/20 p-6">
          <h2 class="font-semibold text-lg mb-2">Guarda estos códigos de recuperación</h2>
          <p class="text-sm text-slate-300 mb-4">Cada código funciona una sola vez. Guárdalos fuera de este sitio antes de continuar.</p>
          <div class="grid grid-cols-2 gap-2 font-mono text-sm mb-5">@for (item of recoveryCodes(); track item) {<code>{{ item }}</code>}</div>
          <button type="button" (click)="finish()" class="rounded-lg bg-white text-slate-950 px-5 py-2 font-semibold">Ya los guardé</button>
        </div>
      }

      @if (error()) {<p class="text-sm text-rose-400 mt-4">{{ error() }}</p>}
    </section>
  `,
})
export class SecurityComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly setup = signal<MfaSetup | null>(null);
  readonly recoveryCodes = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  code = '';

  startSetup(): void {
    this.loading.set(true);
    this.auth.setupMfa().subscribe({
      next: (data) => { this.setup.set(data); this.loading.set(false); },
      error: () => { this.error.set('No se pudo iniciar la configuración'); this.loading.set(false); },
    });
  }

  enable(): void {
    const setup = this.setup();
    if (!setup) return;
    this.loading.set(true);
    this.auth.enableMfa(setup.setupToken, this.code).subscribe({
      next: (result) => { this.recoveryCodes.set(result.recoveryCodes); this.setup.set(null); this.loading.set(false); },
      error: () => { this.error.set('El código no es válido o la configuración expiró'); this.loading.set(false); },
    });
  }

  finish(): void {
    void this.router.navigate(['/admin/login']);
  }
}
