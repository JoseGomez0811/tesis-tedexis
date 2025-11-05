import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    const currentUser = this.authService.getUser();
    if (!currentUser) {
      this.router.navigate(['/login']);
      return new Observable(subscriber => subscriber.next(false));
    }

    return this.apiService.getUsers().pipe(
      map((users: User[]) => {
        const matchedUser = users.find(u => u.name === currentUser.name);
        
        if (matchedUser && matchedUser.role === 'admin') {
          return true; // ✅ Acceso permitido
        }

        // 🚫 Si no es admin, lo redirigimos al perfil
        this.router.navigate(['/app/perfil']);
        return false;
      })
    );
  }
}
