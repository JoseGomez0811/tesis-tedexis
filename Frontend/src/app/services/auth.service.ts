// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, timer, of } from 'rxjs';
import { tap, catchError, switchMap, finalize, shareReplay } from 'rxjs/operators';

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
  private tokenExpirationHandled = false;
  private sessionExpiredSubject = new BehaviorSubject<boolean>(false);
  public sessionExpired$ = this.sessionExpiredSubject.asObservable();
  private readonly sessionExpiredMessage = 'Tu sesión ha expirado. Si deseas continuar utilizando la plataforma, inicia sesión nuevamente.';
  private cache = new Map<string, { timestamp: number; data: any }>();
  private cacheTTL = 60 * 1000;
  private inFlightRequests = new Map<string, Observable<any>>();

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}
  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { timestamp: Date.now(), data });
  }

  private invalidateCache(keys: string | string[]): void {
    const list = Array.isArray(keys) ? keys : [keys];
    list.forEach(key => this.cache.delete(key));
  }

  private createRequestKey(method: string, url: string, payload?: any): string {
    const payloadKey = payload ? JSON.stringify(payload) : '';
    return `${method}:${url}:${payloadKey}`;
  }

  private runWithInflightControl<T>(key: string, factory: () => Observable<T>): Observable<T> {
    const existing = this.inFlightRequests.get(key);
    if (existing) {
      return existing;
    }

    const request$ = factory().pipe(
      finalize(() => this.inFlightRequests.delete(key)),
      shareReplay(1)
    );

    this.inFlightRequests.set(key, request$);
    return request$;
  }


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
    console.log('🔐 Guardando token y datos de usuario...');
    
    // Guardar token y usuario de forma síncrona
    localStorage.setItem('auth_token', token);
    this.tokenSubject.next(token);

    if (userData) {
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }

    // Verificar inmediatamente que el token se guardó
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken !== token) {
      console.error('❌ Error: Token no se guardó correctamente');
      this.handleAuthError('auth_failed');
      return;
    }

    console.log('✅ Token guardado correctamente, obteniendo cookie CSRF...');

    // Obtener cookie CSRF antes de navegar para asegurar que las cookies de sesión estén listas
    // Esto previene problemas de timing donde los componentes hacen peticiones antes de que
    // las cookies de Sanctum estén establecidas
    this.getCsrfCookie().subscribe({
      next: () => {
        console.log('✅ Cookie CSRF obtenida, esperando sincronización...');
        // Aumentar el delay para asegurar que todo esté sincronizado
        // Esto da tiempo para que el token esté disponible en el interceptor
        setTimeout(() => {
          // Verificar nuevamente que el token esté disponible
          const finalToken = localStorage.getItem('auth_token');
          if (finalToken && finalToken === token) {
            console.log('✅ Token verificado, navegando a perfil...');
            this.router.navigate(['/app/perfil']);
          } else {
            console.error('❌ Error: Token no disponible después del delay');
            this.handleAuthError('auth_failed');
          }
        }, 300); // Aumentado de 100ms a 300ms para dar más tiempo
      },
      error: (error) => {
        console.error('❌ Error obteniendo cookie CSRF:', error);
        // Aún así, intentar navegar después de un delay más largo
        // para dar tiempo a que el token esté disponible
        setTimeout(() => {
          const finalToken = localStorage.getItem('auth_token');
          if (finalToken && finalToken === token) {
            console.log('⚠️ Navegando sin cookie CSRF, pero con token válido');
            this.router.navigate(['/app/perfil']);
          } else {
            console.error('❌ Token no disponible, no se puede navegar');
            this.handleAuthError('auth_failed');
          }
        }, 300);
      }
    });
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

  logout(redirect: boolean = true): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.tokenSubject.next(null);
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  handleTokenExpiration(): void {
    if (this.tokenExpirationHandled) {
      return;
    }

    this.tokenExpirationHandled = true;
    this.logout(false);
    this.sessionExpiredSubject.next(true);
  }

  getSessionExpiredMessage(): string {
    return this.sessionExpiredMessage;
  }

  confirmSessionExpiration(): void {
    this.sessionExpiredSubject.next(false);
    this.tokenExpirationHandled = false;
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
    const cacheKey = 'admin_all_users';
    const cached = this.getCache<ApiResponse<User[]>>(cacheKey);
    if (cached) {
      return of(cached);
    }

    const url = `${this.baseUrl}/api/admin/users/all`;
    return this.http.get<ApiResponse<User[]>>(url).pipe(
      tap(res => this.setCache(cacheKey, res)),
      catchError(error => {
        console.error('Error obteniendo usuarios:', error.status);
        return throwError(() => error);
      })
    );
  }

  getPendingUsers(): Observable<ApiResponse<User[]>> {
    const cacheKey = 'admin_pending_users';
    const cached = this.getCache<ApiResponse<User[]>>(cacheKey);
    if (cached) {
      return of(cached);
    }

    const url = `${this.baseUrl}/api/admin/users/pending`;
    return this.http.get<ApiResponse<User[]>>(url).pipe(
      tap(res => this.setCache(cacheKey, res)),
      catchError(error => throwError(() => error))
    );
  }

  // auth.service.ts - Método corregido para authorizeUser
  authorizeUser(userId: number): Observable<ApiResponse<User>> {
    console.log('🚀 Iniciando autorización de usuario:', userId);
    
    const url = `${this.baseUrl}/api/admin/users/${userId}/authorize`;
    const key = this.createRequestKey('POST', url, { userId });

    return this.runWithInflightControl(key, () =>
      this.getCsrfCookie().pipe(
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

        console.log('📤 Enviando petición POST a:', url);

        return this.http.post<ApiResponse<User>>(
          url,
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
      }),
      tap(() => this.invalidateCache(['admin_all_users', 'admin_pending_users']))
    ));
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
    const url = `${this.baseUrl}/api/admin/users/${userId}/reject`;
    const key = this.createRequestKey('POST', url, { userId });

    return this.runWithInflightControl(key, () =>
      this.getCsrfCookie().pipe(
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
          url,
          {},
          {
            withCredentials: true,
            headers: new HttpHeaders(headers)
          }
        );
      }),
      catchError(error => throwError(() => error)),
      tap(() => this.invalidateCache(['admin_all_users', 'admin_pending_users']))
    ));
  }

  // Aplicar el mismo patrón a makeAdmin y removeAdmin
  makeAdmin(userId: number): Observable<ApiResponse<User>> {
    const url = `${this.baseUrl}/api/admin/users/${userId}/make-admin`;
    const key = this.createRequestKey('POST', url, { userId });

    return this.runWithInflightControl(key, () =>
      this.getCsrfCookie().pipe(
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
          url,
          {},
          {
            withCredentials: true,
            headers: new HttpHeaders(headers)
          }
        );
      }),
      catchError(error => throwError(() => error)),
      tap(() => this.invalidateCache(['admin_all_users', 'admin_pending_users']))
    ));
  }

  removeAdmin(userId: number): Observable<ApiResponse<User>> {
    const url = `${this.baseUrl}/api/admin/users/${userId}/remove-admin`;
    const key = this.createRequestKey('POST', url, { userId });

    return this.runWithInflightControl(key, () =>
      this.getCsrfCookie().pipe(
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
          url,
          {},
          {
            withCredentials: true,
            headers: new HttpHeaders(headers)
          }
        );
      }),
      catchError(error => throwError(() => error)),
      tap(() => this.invalidateCache(['admin_all_users', 'admin_pending_users']))
    ));
  }
}