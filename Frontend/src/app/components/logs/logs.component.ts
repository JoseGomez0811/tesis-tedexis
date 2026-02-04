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
  anioEspecifico = '';
  mesEspecifico = '';
  anioMesEspecifico = '';

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
        
        // Ordenar por fecha descendente (más reciente primero)
        this.logs.sort((a, b) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA; // Descendente
        });
        
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

      const logDate = new Date(log.created_at);
      const today = new Date();

      let matchFecha = true;
      if (this.filtroFecha === 'hoy') {
        matchFecha = logDate.toDateString() === today.toDateString();
      } else if (this.filtroFecha === 'semana') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        matchFecha = logDate >= weekAgo && logDate <= today;
      } else if (this.filtroFecha === 'mes') {
        matchFecha = logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear();
      } else if (this.filtroFecha === 'año') {
        matchFecha = logDate.getFullYear() === today.getFullYear();
      } else if (this.filtroFecha === 'personalizada' && this.fechaEspecifica) {
        // Parsear la fecha del input correctamente (viene en formato YYYY-MM-DD)
        const [year, month, day] = this.fechaEspecifica.split('-').map(Number);
        
        // Crear fecha personalizada sin problemas de zona horaria
        const customDateNormalized = new Date(year, month - 1, day);
        
        // Normalizar la fecha del log
        const logDateNormalized = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
        
        // Comparar timestamps
        matchFecha = logDateNormalized.getTime() === customDateNormalized.getTime();
        
        // Debug
        console.log('📅 Comparando fechas:');
        console.log('  - Fecha personalizada:', customDateNormalized.toLocaleDateString());
        console.log('  - Fecha log:', logDateNormalized.toLocaleDateString());
        console.log('  - ¿Coinciden?:', matchFecha);
      } else if (this.filtroFecha === 'año_especifico') {
        // Filtrar por año específico
        if (this.anioEspecifico && this.anioEspecifico.toString().trim() !== '') {
          const anioSeleccionado = parseInt(this.anioEspecifico.toString());
          if (!isNaN(anioSeleccionado) && anioSeleccionado >= 2000 && anioSeleccionado <= 2100) {
            matchFecha = logDate.getFullYear() === anioSeleccionado;
          }
        }
      } else if (this.filtroFecha === 'mes_año_especifico') {
        // Filtrar por mes y año específico
        if (this.mesEspecifico && this.anioMesEspecifico && 
            this.mesEspecifico.toString().trim() !== '' && 
            this.anioMesEspecifico.toString().trim() !== '') {
          const mesSeleccionado = parseInt(this.mesEspecifico.toString()) - 1; // Los meses en JS van de 0-11
          const anioSeleccionado = parseInt(this.anioMesEspecifico.toString());
          if (!isNaN(mesSeleccionado) && !isNaN(anioSeleccionado) && 
              mesSeleccionado >= 0 && mesSeleccionado <= 11 &&
              anioSeleccionado >= 2000 && anioSeleccionado <= 2100) {
            matchFecha = logDate.getMonth() === mesSeleccionado && logDate.getFullYear() === anioSeleccionado;
          }
        }
      }

      return matchUsuario && matchFecha;
    });
    
    // Limpiar campos no utilizados según el filtro seleccionado (después de aplicar el filtro)
    if (this.filtroFecha !== 'personalizada') {
      this.fechaEspecifica = '';
    }
    if (this.filtroFecha !== 'año_especifico') {
      this.anioEspecifico = '';
    }
    if (this.filtroFecha !== 'mes_año_especifico') {
      this.mesEspecifico = '';
      this.anioMesEspecifico = '';
    }
    
    // Ordenar por fecha descendente (más reciente primero)
    this.filteredLogs.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Descendente
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
