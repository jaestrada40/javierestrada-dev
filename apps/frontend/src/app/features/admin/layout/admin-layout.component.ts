import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-950 flex">
      <aside class="w-56 shrink-0 border-r border-slate-800 p-5 flex flex-col gap-1">
        <p class="font-bold text-lg mb-4" style="font-family: var(--font-display)">Panel</p>
        <a
          routerLink="/admin"
          [routerLinkActiveOptions]="{ exact: true }"
          routerLinkActive="bg-slate-800 text-white"
          class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900"
          >Perfil</a
        >
        <a
          routerLink="/admin/skills"
          routerLinkActive="bg-slate-800 text-white"
          class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900"
          >Skills</a
        >
        <a routerLink="/" class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900">Ver sitio</a>
        <button
          type="button"
          (click)="logout()"
          class="mt-auto rounded-lg px-3 py-2 text-left text-rose-400 hover:bg-slate-900"
        >
          Salir
        </button>
      </aside>
      <main class="flex-1 p-8 max-w-4xl">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/admin/login']);
  }
}
