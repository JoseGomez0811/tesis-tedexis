import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  authorization_status: 'pending' | 'authorized' | 'rejected';
  avatar?: string;
  google_id?: string;
  email_verified_at?: string;
  created_at?: string;
  role?: string; // 👈 agregado para soportar el rol en la vista
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();
  
  private readonly baseUrl = 'http://localhost:8000';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    const token = this.getToken();
    if (token) this.tokenSubject.next(token);
  }

  /** Redirige al login de Google */
  loginWithGoogle(): void {
    console.log('🚀 Iniciando login con Google...');
    window.location.href = `${this.baseUrl}/google-auth/redirect`;
  }

  /** Guarda token y datos del usuario */
  handleAuthSuccess(token: string, userData?: User): void {
    console.log('🎉 Token recibido:', token);
    localStorage.setItem('auth_token', token);
    this.tokenSubject.next(token);

    if (userData) {
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }

    console.log('✅ Redirigiendo a perfil...');
    this.router.navigate(['/app/perfil']);
  }

  handleAuthError(error: string, status?: string, firstLogin?: string): void {
    console.error('❌ Error de autenticación:', error, 'Status:', status);
    let errorMessage = 'Error en el inicio de sesión. Por favor, inténtalo de nuevo.';
    
    if (status) {
      switch (status) {
        case 'pending':
          const isFirstLogin = firstLogin === 'true';
          errorMessage = isFirstLogin 
            ? 'Tu cuenta ha sido creada exitosamente. Debes esperar a que un administrador autorice tu acceso.'
            : 'Tu cuenta está pendiente de autorización. Por favor, espera a que un administrador apruebe tu acceso.';
          break;
        case 'rejected':
          errorMessage = 'Tu acceso ha sido rechazado. Contacta al administrador del sistema.';
          break;
      }
    } else {
      switch (error) {
        case 'domain_not_allowed':
          errorMessage = 'Solo los usuarios con correo @tedexis.com, @gmail.com o @correo.unimet.edu.ve pueden acceder.';
          break;
        case 'auth_failed':
          errorMessage = 'Error en la autenticación. Inténtalo de nuevo.';
          break;
        case 'invalid_callback':
          errorMessage = 'Callback inválido. Inténtalo de nuevo.';
          break;
      }
    }

    alert(errorMessage);
    this.router.navigate(['/login']);
  }

  logout(): void {
    console.log('👋 Cerrando sesión...');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.tokenSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    const userJson = localStorage.getItem('auth_user');
    return userJson ? JSON.parse(userJson) as User : null;
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  getAllUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/api/admin/users/all`, {
      headers: this.getAuthHeaders()
    });
  }

  getPendingUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/api/admin/users/pending`, {
      headers: this.getAuthHeaders()
    });
  }

  authorizeUser(userId: number): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/api/admin/users/${userId}/authorize`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  rejectUser(userId: number): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/api/admin/users/${userId}/reject`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  makeAdmin(userId: number): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(
      `${this.baseUrl}/api/admin/users/${userId}/make-admin`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /** ✅ Quita privilegios de administrador */
  removeAdmin(userId: number): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(
      `${this.baseUrl}/api/admin/users/${userId}/remove-admin`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }
}
