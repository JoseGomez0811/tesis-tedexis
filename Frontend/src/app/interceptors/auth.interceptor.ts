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
    const token = localStorage.getItem('auth_token');
    
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
      authReq = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        withCredentials: true
      });
    } else {
      // Para requests sin token, mantener withCredentials
      authReq = req.clone({
        withCredentials: true
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          this.router.navigate(['/login'], {
            queryParams: { error: 'session_expired' }
          });
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