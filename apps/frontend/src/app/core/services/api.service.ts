import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Profile, Skill, SkillCategory } from '../../models';

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
}
