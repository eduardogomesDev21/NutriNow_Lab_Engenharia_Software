// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  email: string;
  password: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    withCredentials: true // Para manter a sessão
  };

  constructor(private http: HttpClient) {
    // Verifica se há usuário logado ao inicializar
    this.checkAuthStatus();
  }

  register(userData: RegisterRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/register`, userData, this.httpOptions);
  }

  login(credentials: LoginRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/login`, credentials, this.httpOptions)
      .pipe(
        tap(response => {
          if (response.success && response.user) {
            this.currentUserSubject.next(response.user);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
          }
        })
      );
  }

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/logout`, {}, this.httpOptions)
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          localStorage.removeItem('currentUser');
        })
      );
  }

  private checkAuthStatus(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
}