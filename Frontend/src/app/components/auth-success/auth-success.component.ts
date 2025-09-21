import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-success',
  template: `<p>Procesando inicio de sesión...</p>`
})
export class AuthSuccessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.authService.handleAuthSuccess(token);
      } else {
        this.authService.handleAuthError('auth_failed');
      }
    });
  }
}
