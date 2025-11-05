import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { navbarData } from './nav-data';
import { AuthService, User } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

interface SideNavToggle {
  screenWidth: number;
  collapsed: boolean;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgClass],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent implements OnInit {
  @Output() onToggleSideNav = new EventEmitter<SideNavToggle>();

  collapsed = false;
  screenWidth = 0;
  navData: any[] = [];
  user: User | null = null;
  googleUserData = { fullName: '', email: '' };
  users: User[] = [];
  loading = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  @HostListener('window:resize')
  onResize() {
    this.screenWidth = window.innerWidth;
    if (this.screenWidth <= 768) {
      this.collapsed = true;
      this.emitToggle();
    }
  }

  ngOnInit(): void {
    this.loadUsers();
    this.screenWidth = window.innerWidth;

    const currentUser = this.authService.getUser();
    if (!currentUser) {
      this.authService.logout();
      return;
    }

    this.user = currentUser;
    this.googleUserData = {
      fullName: currentUser.name || '',
      email: currentUser.email || '',
    };

    this.loadNavData();
    this.emitToggle();

    if (this.screenWidth <= 768) {
      this.collapsed = true;
      this.emitToggle();
    }
  }

  /** 🔹 Carga todos los usuarios (solo para mantener lista actualizada) */
  private loadUsers(): void {
    this.loading = true;
    this.authService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) this.users = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.loading = false;
      }
    });
  }

  /** 🔹 Filtra los ítems del navbar según el rol del usuario */
  private loadNavData(): void {
    this.apiService.getUsers().subscribe({
      next: (users: User[]) => {
        const matchedUser = users.find(u => u.name === this.googleUserData.fullName);

        if (!matchedUser) {
          console.warn('⚠️ No se encontró el usuario en la base de datos');
          return;
        }

        const role = matchedUser.role;
        console.log('Usuario actual:', matchedUser.name, '| Rol:', role);

        this.navData = navbarData.filter(item =>
          item.role === 'all' || item.role === role
        );

        console.table(this.navData.map(i => ({
          label: i.label, role: i.role
        })));
      },
      error: (err) => console.error('❌ Error al obtener usuarios:', err)
    });
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.emitToggle();
  }

  closeSidenav(): void {
    this.collapsed = true;
    this.emitToggle();
  }

  logout(): void {
    this.authService.logout();
  }

  private emitToggle(): void {
    this.onToggleSideNav.emit({
      collapsed: this.collapsed,
      screenWidth: this.screenWidth
    });
  }
}
