import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';

export type LoginResult =
  | { mfaRequired: false; authenticated: true }
  | { mfaRequired: true; challengeToken: string };

export interface MfaSetup {
  secret: string;
  qrCode: string;
  setupToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly isLoggedIn = signal(false);

  login(username: string, password: string): Observable<LoginResult> {
    return this.http.post<LoginResult>('/api/auth/login', { username, password }).pipe(
      tap((result) => {
        if (!result.mfaRequired) this.isLoggedIn.set(true);
      }),
    );
  }

  verifyMfa(challengeToken: string, code: string): Observable<void> {
    return this.http.post<void>('/api/auth/mfa/verify', { challengeToken, code }).pipe(
      tap(() => this.isLoggedIn.set(true)),
    );
  }

  checkSession(): Observable<boolean> {
    return this.http.get<{ authenticated: true }>('/api/auth/session').pipe(
      tap(() => this.isLoggedIn.set(true)),
      map(() => true),
      catchError(() => {
        this.isLoggedIn.set(false);
        return of(false);
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {}).pipe(
      catchError(() => of(undefined)),
      tap(() => this.isLoggedIn.set(false)),
    );
  }

  setupMfa(): Observable<MfaSetup> {
    return this.http.post<MfaSetup>('/api/auth/mfa/setup', {});
  }

  enableMfa(setupToken: string, code: string): Observable<{ recoveryCodes: string[] }> {
    return this.http.post<{ recoveryCodes: string[] }>('/api/auth/mfa/enable', { setupToken, code }).pipe(
      tap(() => this.isLoggedIn.set(false)),
    );
  }
}
