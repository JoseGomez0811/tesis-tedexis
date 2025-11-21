import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgForOf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SidenavService } from '../../services/sidenav.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.component.html',
})
export class LogsComponent implements OnInit {
  userList: any[] = [];
  logs: any[] = [];
  filteredLogs: any[] = [];

  filtroUsuario = '';
  filtroFecha = '';
  fechaEspecifica = '';

  googleUserData = {
    fullName: '',
    email: '',
    accessLevel: '',
  };

  isSideNavCollapsed = false;
  private sidenavSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private sidenavService: SidenavService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.googleUserData = {
        fullName: user.name || '',
        email: user.email || '',
        accessLevel: 'Usuario',
      };
    } else {
      this.authService.logout();
      return;
    }

    // Verificar que el token esté disponible antes de cargar datos
    const token = this.authService.getToken();
    if (!token) {
      console.warn('⚠️ Token no disponible en LogsComponent, esperando...');
      setTimeout(() => {
        const retryToken = this.authService.getToken();
        if (retryToken) {
          this.loadUsers();
          this.loadLogs();
        } else {
          console.error('❌ Token no disponible después de esperar');
          this.authService.logout();
        }
      }, 200);
    } else {
      this.loadUsers();
      this.loadLogs();
    }

    this.isSideNavCollapsed = this.sidenavService.getCollapsed();
    this.sidenavSubscription = this.sidenavService.isCollapsed$.subscribe(collapsed => {
      this.isSideNavCollapsed = collapsed;
    });
  }

  ngOnDestroy() {
    if (this.sidenavSubscription) {
      this.sidenavSubscription.unsubscribe();
    }
  }

  /** 🔹 Cargar logs desde la API */
  loadLogs() {
    this.apiService.getLogs().subscribe({
      next: (res: any) => {
        this.logs = Array.isArray(res) ? res : res.data ?? [];
        this.filteredLogs = [...this.logs];
        console.log('📊 Logs cargados:', this.logs);
      },
      error: err => console.error('❌ Error cargando logs:', err)
    });
  }

  /** 🔹 Cargar usuarios */
  loadUsers() {
    this.apiService.getUsers().subscribe({
      next: (res: any) => {
        this.userList = Array.isArray(res) ? res : res.data ?? [];
        console.log('📊 Usuarios cargados:', this.userList);
      },
      error: err => console.error('❌ Error cargando usuarios:', err)
    });
  }

  /** 🔹 Filtrar logs por usuario y fecha */
  applyFilters() {
    this.filteredLogs = this.logs.filter(log => {
      const selectedUser = this.userList.find(u => u.id === log.id_user);
      const matchUsuario = this.filtroUsuario ? selectedUser?.name === this.filtroUsuario : true;

      let matchFecha = true;
      if (this.filtroFecha === 'hoy') {
        const hoy = new Date().toDateString();
        matchFecha = new Date(log.created_at).toDateString() === hoy;
      } else if (this.filtroFecha === 'semana') {
        const ahora = new Date();
        const inicioSemana = new Date(ahora);
        inicioSemana.setDate(ahora.getDate() - ahora.getDay());
        matchFecha = new Date(log.created_at) >= inicioSemana;
      } else if (this.filtroFecha === 'mes') {
        const ahora = new Date();
        const fechaLog = new Date(log.created_at);
        matchFecha = fechaLog.getMonth() === ahora.getMonth() && fechaLog.getFullYear() === ahora.getFullYear();
      } else if (this.filtroFecha === 'año') {
        const ahora = new Date();
        matchFecha = new Date(log.created_at).getFullYear() === ahora.getFullYear();
      } else if (this.filtroFecha === 'personalizada' && this.fechaEspecifica) {
        const fechaLog = new Date(log.created_at).toDateString();
        const fechaSel = new Date(this.fechaEspecifica).toDateString();
        matchFecha = fechaLog === fechaSel;
      }

      return matchUsuario && matchFecha;
    });
  }

  /** 🔹 Obtener nombre de usuario por ID */
  getUser(log: any): string {
    const selectedUser = this.userList.find(u => u.id === log.id_user);
    return selectedUser ? selectedUser.name : 'Desconocido';
  }

  /** 🔹 Obtener descripción */
  getDescription(log: any): string {
    return log.description || 'Desconocido';
  }

  /** 🔹 Obtener fecha formateada */
  getDate(log: any): string {
    return log.created_at ? new Date(log.created_at).toLocaleString() : 'Desconocido';
  }
}
