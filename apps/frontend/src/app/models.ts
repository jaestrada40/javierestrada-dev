export interface Profile {
  id: number;
  name: string;
  tagline: string;
  bio: string;
  email: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  avatarUrl: string | null;
}

export interface Skill {
  id: number;
  name: string;
  level: number;
  icon: string | null;
  featured: boolean;
  sortOrder: number;
  categoryId: number;
}

export interface SkillCategory {
  id: number;
  name: string;
  gradient: string;
  sortOrder: number;
  skills: Skill[];
}

export type Gradient = 'violet' | 'sunset' | 'ocean' | 'lime' | 'candy';

export const GRADIENT_CLASSES: Record<string, string> = {
  violet: 'from-violet-500 via-purple-500 to-fuchsia-500',
  sunset: 'from-orange-500 via-rose-500 to-pink-600',
  ocean: 'from-cyan-400 via-sky-500 to-blue-600',
  lime: 'from-lime-400 via-emerald-500 to-teal-500',
  candy: 'from-pink-400 via-fuchsia-500 to-violet-500',
};
