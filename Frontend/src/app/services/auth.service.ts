// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export interface User {
  name: string;
  email: string;
  [key: string]: any; // Para campos opcionales como avatar, google_id, etc.
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(private router: Router) {
    const token = this.getToken();
    if (token) this.tokenSubject.next(token);
  }

  /** Redirige al login de Google */
  loginWithGoogle(): void {
    console.log('🚀 Iniciando login con Google...');
    window.location.href = `http://localhost:8000/google-auth/redirect`;
  }

  /**
   * Maneja el éxito de la autenticación.
   * Guarda token y datos del usuario en localStorage
   */
  handleAuthSuccess(token: string, userData?: User): void {
    console.log('🎉 Token recibido:', token);

    // Guardar token
    localStorage.setItem('auth_token', token);
    this.tokenSubject.next(token);

    // Guardar información del usuario si viene en la respuesta
    if (userData) {
      localStorage.setItem('auth_user', JSON.stringify(userData));
    }

    console.log('✅ Redirigiendo a perfil...');
    this.router.navigate(['/app/perfil']);
  }

  /** Maneja errores de autenticación */
  handleAuthError(error: string): void {
    console.error('❌ Error de autenticación:', error);

    let errorMessage = 'Error en el inicio de sesión. Por favor, inténtalo de nuevo.';
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

    alert(errorMessage);
    this.router.navigate(['/login']);
  }

  /** Cierra sesión */
  logout(): void {
    console.log('👋 Cerrando sesión...');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.tokenSubject.next(null);
    this.router.navigate(['/login']);
  }

  /** Obtiene el token almacenado */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /** Verifica si hay un usuario autenticado */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Obtiene información del usuario actual */
  getUser(): User | null {
    const userJson = localStorage.getItem('auth_user');
    return userJson ? JSON.parse(userJson) as User : null;
  }
}
