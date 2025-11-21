// auth.interceptor.ts - Versión simplificada
import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Leer el token de forma síncrona
    let token: string | null = null;
    try {
      token = localStorage.getItem('auth_token');
    } catch (error) {
      console.error('❌ Error leyendo token del localStorage:', error);
    }
    
    // Si el request ya tiene headers personalizados (como CSRF), no modificarlos
    // Solo añadir token si no está presente y no es una petición CSRF
    if (req.url.includes('sanctum/csrf-cookie')) {
      // Para CSRF cookie, solo asegurar withCredentials
      return next.handle(req.clone({ withCredentials: true }));
    }
    
    // Si el request ya tiene headers personalizados (CSRF token o X-XSRF-TOKEN), no modificarlos
    // Estos headers indican que el servicio ya configuró el request correctamente
    if (req.headers.has('X-CSRF-TOKEN') || req.headers.has('X-XSRF-TOKEN')) {
      // Ya tiene headers CSRF personalizados, NO modificar nada
      // Solo asegurar withCredentials si no está ya presente
      // IMPORTANTE: No clonar el request si ya tiene withCredentials, solo pasarlo tal cual
      console.log('🔒 Interceptor: Request con CSRF personalizado, NO modificando headers:', {
        'X-CSRF-TOKEN': req.headers.get('X-CSRF-TOKEN') ? 'presente' : 'ausente',
        'X-XSRF-TOKEN': req.headers.get('X-XSRF-TOKEN') ? 'presente' : 'ausente',
        'Authorization': req.headers.get('Authorization') ? 'presente' : 'ausente',
        'URL': req.url
      });
      // El request ya viene con withCredentials del servicio, pasarlo directamente
      return next.handle(req);
    }
    
    // Si el request ya tiene Authorization header personalizado, verificar si necesita withCredentials
    if (req.headers.has('Authorization')) {
      // Verificar si el request ya tiene withCredentials configurado
      const clonedReq = req.clone({ withCredentials: true });
      return next.handle(clonedReq);
    }
    
    // Clonar request y añadir headers si hay token
    let authReq = req;
    if (token) {
      // Verificar que el token no esté vacío o mal formado
      if (token.trim().length === 0) {
        console.warn('⚠️ Interceptor: Token vacío detectado');
      }
      
      const authHeader = `Bearer ${token}`;
      console.log('🔐 Interceptor: Agregando Authorization header', {
        url: req.url,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 30) + '...',
        authHeaderPreview: authHeader.substring(0, 40) + '...'
      });
      
      authReq = req.clone({
        setHeaders: {
          'Authorization': authHeader,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      });
      
      // Verificar que el header se agregó correctamente
      console.log('✅ Interceptor: Request clonado con headers', {
        hasAuthorization: authReq.headers.has('Authorization'),
        authorizationValue: authReq.headers.get('Authorization')?.substring(0, 40) + '...'
      });
    } else {
      // Solo loggear si no es una petición pública (como CSRF cookie)
      if (!req.url.includes('sanctum/csrf-cookie')) {
        console.warn('⚠️ Interceptor: No hay token disponible para la petición', {
          url: req.url
        });
      }
      // Para requests sin token, mantener withCredentials
      authReq = req.clone({
        withCredentials: true
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.error('❌ Interceptor: Error 401 Unauthenticated', {
            url: error.url,
            hasToken: !!localStorage.getItem('auth_token'),
            tokenPreview: localStorage.getItem('auth_token')?.substring(0, 30)
          });
          
          // Solo cerrar sesión si realmente no hay token o si el error persiste
          // No cerrar inmediatamente en el primer intento después del login
          const currentToken = localStorage.getItem('auth_token');
          if (!currentToken) {
            console.log('🔓 Interceptor: No hay token, cerrando sesión');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            this.router.navigate(['/login'], {
              queryParams: { error: 'session_expired' }
            });
          } else {
            console.warn('⚠️ Interceptor: Error 401 pero token existe, podría ser problema de timing');
          }
        }
        
        if (error.status === 403) {
          this.router.navigate(['/app/perfil'], {
            queryParams: { error: 'forbidden' }
          });
        }

        return throwError(() => error);
      })
    );
  }
}