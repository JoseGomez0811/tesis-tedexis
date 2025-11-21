import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SidenavService } from '../../services/sidenav.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgForOf, NgClass } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-addConnection',
  imports: [CommonModule, FormsModule, NgForOf, NgClass],
  templateUrl: './addConnection.component.html',
  styleUrl: './addConnection.component.css',
})
export class AddConnectionComponent implements OnInit, OnDestroy{
  servers: any[] = [];
  selectedServer = '';
  puerto = '';
  nombre = '';
  conexion = '';

  users: any = null;
  connection: any = null;

  connections: any[] = [];
  showForm = false;
  editingId: number | null = null; // <-- Si no es null, estamos en modo edición
  isSubmitting = false;

  googleUserData = {
    fullName: '',
    email: '',
  };

  alertVisible = false;
  alertType: 'success' | 'error' | null = null;
  alertMessage = '';

  isSaving = false;
  isDeleting = false;

  isSideNavCollapsed = false;
  private sidenavSubscription?: Subscription;

  showDeleteConfirm = false;
  deleteTargetId: number | null = null;


  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private sidenavService: SidenavService
  ) {}

  // ==============================
  //         ALERTAS
  // ==============================
  closeAlert() {
    this.alertVisible = false;
  }

  showAlert(type: 'success' | 'error', message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.alertVisible = true;
    setTimeout(() => (this.alertVisible = false), 4000);
  }

  // ==============================
  //       INICIALIZACIÓN
  // ==============================
  ngOnInit() {
    this.loadServers();
    this.loadConnections();
    
    // Suscribirse al estado del sidebar
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

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.cancelEdit();
  }

  // ==============================
  //          CRUD
  // ==============================
  loadServers() {
    this.apiService.getServers().subscribe({
      next: (data: any) => {
        this.servers = Array.isArray(data) ? data : (data.data ?? []);
      },
      error: (err) => console.error('❌ Error al cargar servidores:', err)
    });
  }

  loadConnections() {
    this.apiService.getConnection().subscribe({
      next: (data: any) => {
        this.connections = Array.isArray(data) ? data : (data.data ?? []);
      },
      error: (err) => console.error('❌ Error al cargar conexiones:', err)
    });
  }

  resetForm() {
    this.selectedServer = '';
    this.puerto = '';
    this.nombre = '';
    this.conexion = '';
    this.editingId = null;
    this.showForm = false;
  }

  startEdit(connection: any) {
    this.showForm = true;
    this.editingId = connection.id_connection; // 👈 usa la clave real
    this.selectedServer = connection.id_server;
    this.puerto = connection.port;
    this.nombre = connection.name;
    this.conexion = connection.type;
  }

  cancelEdit() {
    this.resetForm();
  }

  // confirmDelete(id: number) {
  //   if (!confirm('¿Seguro que deseas eliminar este servidor?')) return;
  //   this.deleteServer(id);
  // }

  confirmDelete(id: number) {
    this.deleteTargetId = id;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.deleteTargetId = null;
  }

  confirmDeleteFinal() {
    if (!this.deleteTargetId) return;

    this.showDeleteConfirm = false;

    // Activa overlay de “Eliminando…”
    this.isDeleting = true;

    this.deleteServer(this.deleteTargetId);
    this.deleteTargetId = null;
  }

  async deleteServer(id: number) {
    this.isDeleting = true;
    const currentUser = this.authService.getUser();
    let matchedUser: any = null;

    if (currentUser && currentUser.name) {
      console.log('👤 Usuario cargado. Nombre:', currentUser.name);

      try {
        const users = await lastValueFrom(this.apiService.getUsers());
        // Soportar tanto respuesta directa como { data: [...] }
        const usersArray = Array.isArray(users)
          ? users
          : users && Array.isArray(users.data)
          ? users.data
          : [];

        matchedUser = usersArray.find((u: any) => u?.name === currentUser.name) ?? null;
      } catch (err) {
        console.error('❌ Error obteniendo usuarios para emparejar:', err);
        // No interrumpimos el flujo si no se pudo emparejar
        matchedUser = null;
      }
    } else {
      console.warn('⚠️ No hay usuario autenticado. Cerrando sesión.');
      this.authService.logout();
      return;
    }

    const id_user = matchedUser ? matchedUser.id : null;

    // Confirmación antes de eliminar
    // if (!confirm('¿Seguro que deseas eliminar este servidor?')) return;

    this.apiService.deleteConnection(id, id_user).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showAlert('success', 'Conexión eliminada con éxito ✅');
        this.loadConnections();
      },
      error: (err) => {
        this.isDeleting = false;
        console.error('❌ Error al eliminar conexión:', err);
        this.showAlert('error', 'Error al eliminar conexión');
      }
    });
  }

  // ==============================
  //        GUARDAR / EDITAR
  // ==============================
  async onSubmit(event: Event, form: any) {
    event.preventDefault();
    if (this.isSubmitting) return;

    // 🧩 Validación angular antes de proceder
    if (form.invalid) {
      this.showAlert('error', 'Por favor corrige los errores antes de continuar');
      Object.values(form.controls).forEach((control: any) => {
        control.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.isSaving = true;

    // const id_server = this.servers.find(server => server.name === this.selectedServer)?.id_server ?? null;
    const id_server = this.selectedServer ? Number(this.selectedServer) : null;


    const currentUser = this.authService.getUser();
    let matchedUser: any = null;

    if (currentUser && currentUser.name) {
      console.log('👤 Usuario cargado. Nombre:', currentUser.name);
      try {
        const users = await lastValueFrom(this.apiService.getUsers());
        // Varias APIs devuelven directamente un array o un objeto { data: [...] }
        const usersArray = Array.isArray(users) ? users : (users && Array.isArray(users.data) ? users.data : []);
        matchedUser = usersArray.find((u: any) => u && u.name === currentUser.name) ?? null;
      } catch (err) {
        console.error('❌ Error obteniendo usuarios para emparejar:', err);
        // matchedUser permanecerá en null y el id_user será enviado como null.
      }
    } else {
      console.log('⚠️ No hay usuario autenticado. Cerrando sesión.');
      this.authService.logout();
      this.isSubmitting = false;
      return; // Salimos porque no hay usuario con el que asociar la acción
    }

    const payload = {
      name: this.nombre,
      type: this.conexion,
      port: this.puerto ? parseInt(this.puerto, 10) : null,
      path: null, // Si tienes un campo path opcional, puedes dejarlo así o eliminarlo si no lo usas
      id_server: id_server,
      id_user: matchedUser ? matchedUser.id : null,
    };

    try {
      if (this.editingId) {
        // MODO EDICIÓN
        this.apiService.updateConnection(this.editingId, payload).subscribe({
          next: () => {
            this.isSaving = false;
            this.showAlert('success', 'Conexión actualizada con éxito');
            this.resetForm();
            this.loadConnections();
            this.isSubmitting = false;
          },
          error: (err) => {
            this.isSaving = false;
            console.error('❌ Error al actualizar conexion:', err);
            this.showAlert('error', 'Error al actualizar conexión');
            this.isSubmitting = false;
          }
        });
      } else {
        // MODO CREAR
        this.apiService.addConnection(payload).subscribe({
          next: () => {
            this.isSaving = false;
            this.showAlert('success', 'Conexión registrada con éxito ✅');
            this.resetForm();
            this.loadConnections();
            this.isSubmitting = false;
          },
          error: (err) => {
            this.isSaving = false;
            console.error('❌ Error al registrar conexión:', err);
            this.showAlert('error', 'Error al registrar conexión');
            this.isSubmitting = false;
          }
        });
      }
    } catch (err) {
      this.isSaving = false;
      console.error('❌ onSubmit error:', err);
      this.showAlert('error', 'Ocurrió un error inesperado');
      this.isSubmitting = false;
    }
  }
}