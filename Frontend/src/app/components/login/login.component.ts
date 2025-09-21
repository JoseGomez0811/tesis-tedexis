// src/app/components/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check for error parameters in URL
    this.route.queryParams.subscribe(params => {
      const error = params['error'];
      const domain = params['domain'];
      
      if (error === 'domain_not_allowed') {
        this.errorMessage = `Solo los usuarios con correo @tedexis.com, @gmail.com o @correo.unimet.edu.ve pueden acceder.`;
        if (domain) {
          this.errorMessage += ` Tu dominio "${domain}" no está permitido.`;
        }
      } else if (error) {
        this.errorMessage = 'Error en el inicio de sesión. Por favor, inténtalo de nuevo.';
      }
    });
  }

  loginWithGoogle() {
    this.authService.loginWithGoogle();
  }
}