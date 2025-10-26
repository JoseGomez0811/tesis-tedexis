import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  errorMessage: string = '';
  statusMessage: string = '';
  messageType: 'error' | 'warning' | 'info' = 'error';
  showAlert: boolean = false;

  constructor(private authService: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      const userStr = params['user'];
      const error = params['error'];
      const status = params['status'];
      const domain = params['domain'];
      const details = params['details'];

      this.errorMessage = '';
      this.statusMessage = '';

      if (token && userStr) {
        try {
          const userData = JSON.parse(decodeURIComponent(userStr));
          if (userData.authorization_status === 'authorized') {
            this.authService.handleAuthSuccess(token, userData);
            return;
          } else {
            this.showWarning('Tu cuenta está pendiente de autorización.');
            return;
          }
        } catch {
          this.showError('Error procesando los datos de usuario. Inténtalo de nuevo.');
          return;
        }
      }

      if (status === 'pending') {
        this.showWarning('Tu cuenta está pendiente de autorización.');
        return;
      }

      if (error) this.handleAuthenticationError(error, domain, details);
    });
  }

  private handleAuthenticationError(error: string, domain?: string, details?: string): void {
    switch (error) {
      case 'domain_not_allowed':
        let domainMessage = 'Solo los usuarios con correo permitido pueden acceder.';
        if (domain) domainMessage += `\n\nTu dominio "${domain}" no está permitido.`;
        this.showError(domainMessage);
        break;

      case 'auth_failed':
        let authMessage = 'Error en la autenticación con Google.';
        if (details) authMessage += `\n\nDetalles: ${decodeURIComponent(details)}`;
        authMessage += '\n\nPor favor, inténtalo de nuevo.';
        this.showError(authMessage);
        break;

      default:
        this.showError('Error desconocido en el inicio de sesión. Inténtalo de nuevo.');
    }
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.messageType = 'error';
    this.triggerAlert();
  }

  private showWarning(message: string): void {
    this.statusMessage = message;
    this.messageType = 'warning';
    this.triggerAlert();
  }

  private showInfo(message: string): void {
    this.statusMessage = message;
    this.messageType = 'info';
    this.triggerAlert();
  }

  private triggerAlert(): void {
    this.showAlert = true;
    setTimeout(() => (this.showAlert = false), 5000); // Auto-ocultar después de 5s
  }

  dismissMessage(): void {
    this.showAlert = false;
    this.errorMessage = '';
    this.statusMessage = '';
  }

  loginWithGoogle(): void {
    this.dismissMessage();
    this.authService.loginWithGoogle();
  }

  get hasMessage(): boolean {
    return !!(this.errorMessage || this.statusMessage);
  }

  get currentMessage(): string {
    return this.errorMessage || this.statusMessage;
  }

  getButtonText(): string {
    switch (this.messageType) {
      case 'info':
        return 'Solicitud Enviada';
      case 'warning':
        return 'Esperando Autorización';
      case 'error':
        return this.currentMessage.includes('rechazada') ? 'Acceso Denegado' : 'Iniciar sesión con Google';
      default:
        return 'Iniciar sesión con Google';
    }
  }
}
