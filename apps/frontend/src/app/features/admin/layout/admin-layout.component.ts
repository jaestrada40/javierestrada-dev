import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-theme min-h-screen bg-slate-950 text-slate-100 flex">
      <aside class="w-60 shrink-0 border-r border-slate-700/70 bg-slate-950 p-5 flex flex-col gap-1 shadow-xl shadow-black/10">
        <p class="font-bold text-xl text-white mb-1" style="font-family: var(--font-display)">Panel</p>
        <p class="font-mono text-[10px] uppercase tracking-[.18em] text-emerald-400 mb-5">javierestrada.dev</p>
        <a
          routerLink="/admin"
          [routerLinkActiveOptions]="{ exact: true }"
          routerLinkActive="bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/40"
          class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900"
          >Perfil</a
        >
        <a
          routerLink="/admin/skills"
          routerLinkActive="bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/40"
          class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900"
          >Skills</a
        >
        <a
          routerLink="/admin/projects"
          routerLinkActive="bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/40"
          class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900"
          >Proyectos</a
        >
        <a
          routerLink="/admin/experience"
          routerLinkActive="bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/40"
          class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900"
          >Experiencia</a
        >
        <a
          routerLink="/admin/posts"
          routerLinkActive="bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/40"
          class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900"
          >Blog</a
        >
        <a
          routerLink="/admin/security"
          routerLinkActive="bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-500/40"
          class="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-900"
          >Seguridad</a
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
      <main class="flex-1 p-8 md:p-10 max-w-5xl bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.07),transparent_28rem)]">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigate(['/admin/login']));
  }
}
