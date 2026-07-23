import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Experience, Post, Profile, Project, Skill, SkillCategory } from '../../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>('/api/profile');
  }

  updateProfile(data: Partial<Profile>): Observable<Profile> {
    return this.http.patch<Profile>('/api/profile', data);
  }

  getSkills(): Observable<SkillCategory[]> {
    return this.http.get<SkillCategory[]>('/api/skills');
  }

  createCategory(data: { name: string; gradient?: string; sortOrder?: number }): Observable<SkillCategory> {
    return this.http.post<SkillCategory>('/api/categories', data);
  }

  updateCategory(id: number, data: Partial<SkillCategory>): Observable<SkillCategory> {
    const { name, gradient, sortOrder } = data;
    return this.http.patch<SkillCategory>(`/api/categories/${id}`, { name, gradient, sortOrder });
  }

  deleteCategory(id: number): Observable<SkillCategory> {
    return this.http.delete<SkillCategory>(`/api/categories/${id}`);
  }

  createSkill(data: Partial<Skill> & { name: string; categoryId: number }): Observable<Skill> {
    return this.http.post<Skill>('/api/skills', data);
  }

  updateSkill(id: number, data: Partial<Skill>): Observable<Skill> {
    const { name, level, icon, featured, sortOrder, categoryId } = data;
    return this.http.patch<Skill>(`/api/skills/${id}`, { name, level, icon, featured, sortOrder, categoryId });
  }

  deleteSkill(id: number): Observable<Skill> {
    return this.http.delete<Skill>(`/api/skills/${id}`);
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>('/api/projects');
  }

  createProject(data: Partial<Project> & { name: string; description: string; stack: string }): Observable<Project> {
    return this.http.post<Project>('/api/projects', data);
  }

  updateProject(id: number, data: Partial<Project>): Observable<Project> {
    const { name, description, descriptionEn, stack, githubUrl, demoUrl, featured, sortOrder } = data;
    return this.http.patch<Project>(`/api/projects/${id}`, {
      name, description, descriptionEn, stack,
      githubUrl: githubUrl || undefined,
      demoUrl: demoUrl || undefined,
      featured, sortOrder,
    });
  }

  deleteProject(id: number): Observable<Project> {
    return this.http.delete<Project>(`/api/projects/${id}`);
  }

  getExperience(): Observable<Experience[]> {
    return this.http.get<Experience[]>('/api/experience');
  }

  createExperience(data: Partial<Experience> & { kind: string; title: string; organization: string; startYear: number; description: string }): Observable<Experience> {
    return this.http.post<Experience>('/api/experience', data);
  }

  updateExperience(id: number, data: Partial<Experience>): Observable<Experience> {
    const { kind, title, titleEn, organization, startYear, endYear, description, descriptionEn, sortOrder } = data;
    return this.http.patch<Experience>(`/api/experience/${id}`, {
      kind, title, titleEn, organization, startYear,
      endYear: endYear ?? undefined,
      description, descriptionEn, sortOrder,
    });
  }

  deleteExperience(id: number): Observable<Experience> {
    return this.http.delete<Experience>(`/api/experience/${id}`);
  }

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>('/api/posts');
  }

  getPost(slug: string): Observable<Post> {
    return this.http.get<Post>(`/api/posts/${slug}`);
  }

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>('/api/posts/all');
  }

  createPost(data: { title: string; excerpt: string; content: string; published?: boolean }): Observable<Post> {
    return this.http.post<Post>('/api/posts', data);
  }

  updatePost(id: number, data: Partial<Post>): Observable<Post> {
    const { title, excerpt, content, published } = data;
    return this.http.patch<Post>(`/api/posts/${id}`, { title, excerpt, content, published });
  }

  deletePost(id: number): Observable<Post> {
    return this.http.delete<Post>(`/api/posts/${id}`);
  }

  translate(text: string): Observable<{ translated: string }> {
    return this.http.post<{ translated: string }>('/api/translate', { text });
  }
}
