import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'blog',
    loadComponent: () => import('./features/blog/blog-list.component').then((m) => m.BlogListComponent),
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./features/blog/blog-post.component').then((m) => m.BlogPostComponent),
  },
  {
    path: 'cv',
    loadComponent: () => import('./features/cv/cv.component').then((m) => m.CvComponent),
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/profile-edit/profile-edit.component').then(
            (m) => m.ProfileEditComponent,
          ),
      },
      {
        path: 'skills',
        loadComponent: () =>
          import('./features/admin/skills-admin/skills-admin.component').then(
            (m) => m.SkillsAdminComponent,
          ),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/admin/projects-admin/projects-admin.component').then(
            (m) => m.ProjectsAdminComponent,
          ),
      },
      {
        path: 'experience',
        loadComponent: () =>
          import('./features/admin/experience-admin/experience-admin.component').then(
            (m) => m.ExperienceAdminComponent,
          ),
      },
      {
        path: 'posts',
        loadComponent: () =>
          import('./features/admin/posts-admin/posts-admin.component').then(
            (m) => m.PostsAdminComponent,
          ),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./features/admin/security/security.component').then(
            (m) => m.SecurityComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
