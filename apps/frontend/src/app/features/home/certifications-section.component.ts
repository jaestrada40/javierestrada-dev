import { Component } from '@angular/core';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-certifications-section',
  imports: [RevealDirective],
  template: `
    <section id="certificaciones" class="max-w-6xl mx-auto px-6 py-16">
      <div class="flex items-end justify-between gap-6 mb-10">
        <div><p class="font-mono text-xs text-accent tracking-[.2em] uppercase mb-3">Credenciales</p><h2 class="font-display font-bold text-3xl tracking-tight">Certificaciones AWS</h2></div>
        <span class="hidden sm:block font-mono text-xs text-ink-dim">Cloud · Desarrollo</span>
      </div>
      <div class="grid md:grid-cols-2 gap-5">
        <article appReveal class="bg-white border border-navy-700 rounded-2xl p-6 flex gap-5 items-center hover:-translate-y-1 hover:shadow-lg transition">
          <div class="w-14 h-14 rounded-xl bg-accent text-white grid place-items-center font-mono font-bold text-xs shrink-0">AWS</div>
          <div><p class="font-mono text-[10px] text-accent uppercase tracking-widest mb-1">AWS Certified</p><h3 class="font-display font-bold text-lg">Cloud Practitioner</h3><p class="text-sm text-ink-dim mt-1">Fundamentos de nube, seguridad y servicios AWS.</p></div>
        </article>
        <article appReveal class="bg-white border border-navy-700 rounded-2xl p-6 flex gap-5 items-center hover:-translate-y-1 hover:shadow-lg transition">
          <div class="w-14 h-14 rounded-xl bg-accent text-white grid place-items-center font-mono font-bold text-xs shrink-0">AWS</div>
          <div><p class="font-mono text-[10px] text-accent uppercase tracking-widest mb-1">AWS Certified</p><h3 class="font-display font-bold text-lg">Developer – Associate</h3><p class="text-sm text-ink-dim mt-1">Desarrollo, despliegue y mantenimiento de aplicaciones.</p></div>
        </article>
      </div>
    </section>
  `,
})
export class CertificationsSectionComponent {}
