import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({ 
  selector: 'app-auth-callback',
  template: `
    <div style="padding: 20px; font-family: monospace;">
      <h2>🔍 Debug Auth Callback</h2>
      <pre>{{ debugInfo }}</pre>
    </div>
  `,
  standalone: true,
  imports: []
})
export class AuthCallbackComponent implements OnInit {
  debugInfo = 'Procesando...';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    console.log('🔍 AuthCallbackComponent - OnInit');
    console.log('🌐 URL completa:', window.location.href);
    console.log('🔗 Hash:', window.location.hash);
    
    // Obtener los datos del hash fragment
    const fragment = window.location.hash.substring(1);
    console.log('📋 Fragment:', fragment);
    
    const params = new URLSearchParams(fragment);
    
    const token = params.get('token');
    const userJson = params.get('user');
    const error = params.get('error');
    const status = params.get('status');

    this.debugInfo = `
URL: ${window.location.href}
Hash: ${window.location.hash}
Fragment: ${fragment}

Params extraídos:
- token: ${token ? token.substring(0, 30) + '...' : 'NO'}
- user: ${userJson ? 'SÍ' : 'NO'}
- error: ${error || 'NO'}
- status: ${status || 'NO'}
    `;

    console.log('📦 Params extraídos:', {
      token: token?.substring(0, 30),
      hasUser: !!userJson,
      error,
      status
    });

    // Manejo de errores
    if (error) {
      console.error('❌ Error en callback:', error);
      this.authService.handleAuthError(error, status || undefined);
      return;
    }

    // Si hay status=pending sin token
    if (status === 'pending' && !token) {
      console.warn('⚠️ Usuario pendiente de aprobación');
      this.authService.handleAuthError('pending', status);
      return;
    }

    // Proceso normal con token
    if (token && userJson) {
      try {
        console.log('🔄 Parseando userData...');
        const userData = JSON.parse(decodeURIComponent(userJson));
        console.log('👤 UserData parseado:', userData);
        
        console.log('✅ Llamando handleAuthSuccess...');
        this.authService.handleAuthSuccess(token, userData);
        
        // Verificar guardado
        setTimeout(() => {
          const savedToken = localStorage.getItem('auth_token');
          console.log('🔍 Token en localStorage:', savedToken?.substring(0, 30));
        }, 100);
        
      } catch (error) {
        console.error('❌ Error procesando callback:', error);
        this.authService.handleAuthError('auth_failed');
      }
    } else {
      console.error('❌ Falta token o user en el callback');
      console.log('Token presente:', !!token);
      console.log('User presente:', !!userJson);
      this.authService.handleAuthError('invalid_callback');
    }
  }
}