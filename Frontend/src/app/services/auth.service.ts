// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
  authorization_status: 'pending' | 'authorized' | 'rejected';
  role: string;
  avatar?: string;
  google_id?: string;
  email_verified_at?: string;
  created_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'https://localhost';
  private tokenSubject = new BehaviorSubject<string | null>(this.getToken());
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  private httpOptionsWithCredentials = {
    withCredentials: true
  };

  getCsrfCookie(): Observable<void> {
    return this.http.get<void>(`${this.baseUrl}/sanctum/csrf-cookie`, { withCredentials: true });
  }



  // === AUTENTICACIÓN ===
  loginWithGoogle(): void {
    window.location.href = `${this.baseUrl}/google-auth/redirect`;
  }

  handleAuthSuccess(token: string, userData?: User): void {
    localStorage.setItem('auth_token', token);
    this.tokenSubject.next(token);

    if (userData) {
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }

    this.router.navigate(['/app/perfil']);
  }

  handleAuthError(error: string, status?: string, firstLogin?: string): void {
    let msg = 'Error en el inicio de sesión. Por favor, inténtalo de nuevo.';

    if (status === 'pending') {
      msg = firstLogin === 'true'
        ? 'Tu cuenta ha sido creada exitosamente. Espera autorización del administrador.'
        : 'Tu cuenta está pendiente de aprobación.';
    } else if (status === 'rejected') {
      msg = 'Tu acceso ha sido rechazado. Contacta al administrador.';
    } else {
      const errorMap: Record<string, string> = {
        domain_not_allowed: 'Solo los usuarios con correo @tedexis.com, @gmail.com o @correo.unimet.edu.ve pueden acceder.',
        auth_failed: 'Error en la autenticación. Inténtalo de nuevo.',
        invalid_callback: 'Callback inválido. Inténtalo de nuevo.',
        session_expired: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
      };
      msg = errorMap[error] || msg;
    }

    alert(msg);
    this.router.navigate(['/login']);
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.tokenSubject.next(null);
    this.router.navigate(['/login']);
  }

  // === GETTERS ===
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): User | null {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) as User : null;
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin' && user?.authorization_status === 'authorized';
  }

  // === ADMIN API ===
  getAllUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(
      `${this.baseUrl}/api/admin/users/all`
    ).pipe(
      catchError(error => {
        console.error('Error obteniendo usuarios:', error.status);
        return throwError(() => error);
      })
    );
  }

  getPendingUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(
      `${this.baseUrl}/api/admin/users/pending`
    ).pipe(
      catchError(error => throwError(() => error))
    );
  }

  // auth.service.ts - Método corregido para authorizeUser
  authorizeUser(userId: number): Observable<ApiResponse<User>> {
    console.log('🚀 Iniciando autorización de usuario:', userId);
    
    return this.getCsrfCookie().pipe(
      switchMap(() => {
        console.log('✅ Cookie CSRF obtenida, esperando establecimiento...');
        // Pequeño delay para asegurar que la cookie se estableció
        return timer(200);
      }),
      switchMap(() => {
        // Obtener el token CSRF de las cookies
        const csrfToken = this.getCsrfTokenFromCookie();
        const authToken = this.getToken();
        
        console.log('📋 Headers preparados:', {
          hasCsrfToken: !!csrfToken,
          hasAuthToken: !!authToken,
          csrfTokenPreview: csrfToken ? csrfToken.substring(0, 20) + '...' : 'NO',
          authTokenPreview: authToken ? authToken.substring(0, 20) + '...' : 'NO'
        });
        
        const headers: { [key: string]: string } = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        };

        // Añadir CSRF token como header
        // IMPORTANTE: Laravel Sanctum con cookies encriptadas espera específicamente X-XSRF-TOKEN
        // y lo compara con la cookie XSRF-TOKEN después de desencriptarla
        if (csrfToken) {
          // Laravel busca primero X-XSRF-TOKEN, luego X-CSRF-TOKEN
          headers['X-XSRF-TOKEN'] = csrfToken;
          headers['X-CSRF-TOKEN'] = csrfToken; // Por si acaso
          console.log('📤 Token CSRF añadido a headers:', {
            'X-XSRF-TOKEN': csrfToken.substring(0, 30) + '...',
            'X-CSRF-TOKEN': csrfToken.substring(0, 30) + '...'
          });
        } else {
          console.error('❌ No se pudo obtener el token CSRF de las cookies');
        }

        // Añadir Authorization token
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        } else {
          console.error('❌ No se encontró token de autenticación');
        }

        console.log('📤 Enviando petición POST a:', `${this.baseUrl}/api/admin/users/${userId}/authorize`);

        return this.http.post<ApiResponse<User>>(
          `${this.baseUrl}/api/admin/users/${userId}/authorize`,
          {},
          {
            withCredentials: true,
            headers: new HttpHeaders(headers)
          }
        );
      }),
      catchError(error => {
        console.error('❌ Error autorizando usuario:', error);
        if (error.status === 419) {
          console.error('🔴 Error 419 - CSRF Token Mismatch. Verifica:');
          console.error('  1. Que la cookie XSRF-TOKEN esté establecida');
          console.error('  2. Que el header X-CSRF-TOKEN o X-XSRF-TOKEN esté siendo enviado');
          console.error('  3. Que withCredentials esté habilitado');
          console.error('Cookies actuales:', document.cookie);
        }
        return throwError(() => error);
      })
    );
  }

  // Añadir este método para obtener el CSRF token de las cookies
  private getCsrfTokenFromCookie(): string | null {
    // Laravel almacena el token CSRF en la cookie XSRF-TOKEN
    // La cookie puede venir codificada en URL, necesitamos decodificarla
    const cookieName = 'XSRF-TOKEN';
    const name = cookieName + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    
    console.log('🔍 Buscando token CSRF en cookies:', document.cookie);
    
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        // Extraer el token tal cual está en la cookie
        // IMPORTANTE: NO decodificar el token si Laravel lo encriptó
        // Laravel espera que el valor del header coincida exactamente con el valor de la cookie
        let token = c.substring(name.length);
        
        // Solo decodificar la codificación URL básica (para caracteres especiales como %3D)
        // pero NO intentar desencriptar el contenido si Laravel lo encriptó
        token = decodeURIComponent(token);
        
        console.log('✅ Token CSRF encontrado:', token.substring(0, 30) + '...');
        console.log('📝 Token completo (primeros 100 chars):', token.substring(0, 100));
        return token;
      }
    }
    
    // Si no se encuentra, intentar leer todas las cookies para debug
    console.warn('⚠️ No se encontró token CSRF en cookies. Cookies disponibles:', document.cookie);
    return null;
  }

  // Actualizar también los otros métodos admin de la misma manera
  rejectUser(userId: number): Observable<ApiResponse<User>> {
    return this.getCsrfCookie().pipe(
      switchMap(() => timer(200)),
      switchMap(() => {
        const csrfToken = this.getCsrfTokenFromCookie();
        const authToken = this.getToken();
        
        const headers: { [key: string]: string } = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        };

        if (csrfToken) {
          headers['X-XSRF-TOKEN'] = csrfToken;
          headers['X-CSRF-TOKEN'] = csrfToken;
        }

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        return this.http.post<ApiResponse<User>>(
          `${this.baseUrl}/api/admin/users/${userId}/reject`,
          {},
          {
            withCredentials: true,
            headers: new HttpHeaders(headers)
          }
        );
      }),
      catchError(error => throwError(() => error))
    );
  }

  // Aplicar el mismo patrón a makeAdmin y removeAdmin
  makeAdmin(userId: number): Observable<ApiResponse<User>> {
    return this.getCsrfCookie().pipe(
      switchMap(() => timer(200)),
      switchMap(() => {
        const csrfToken = this.getCsrfTokenFromCookie();
        const authToken = this.getToken();
        
        const headers: { [key: string]: string } = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        };

        if (csrfToken) {
          headers['X-XSRF-TOKEN'] = csrfToken;
          headers['X-CSRF-TOKEN'] = csrfToken;
        }

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        return this.http.post<ApiResponse<User>>(
          `${this.baseUrl}/api/admin/users/${userId}/make-admin`,
          {},
          {
            withCredentials: true,
            headers: new HttpHeaders(headers)
          }
        );
      }),
      catchError(error => throwError(() => error))
    );
  }

  removeAdmin(userId: number): Observable<ApiResponse<User>> {
    return this.getCsrfCookie().pipe(
      switchMap(() => timer(200)),
      switchMap(() => {
        const csrfToken = this.getCsrfTokenFromCookie();
        const authToken = this.getToken();
        
        const headers: { [key: string]: string } = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        };

        if (csrfToken) {
          headers['X-XSRF-TOKEN'] = csrfToken;
          headers['X-CSRF-TOKEN'] = csrfToken;
        }

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        return this.http.post<ApiResponse<User>>(
          `${this.baseUrl}/api/admin/users/${userId}/remove-admin`,
          {},
          {
            withCredentials: true,
            headers: new HttpHeaders(headers)
          }
        );
      }),
      catchError(error => throwError(() => error))
    );
  }
}