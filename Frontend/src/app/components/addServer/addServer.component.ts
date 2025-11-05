import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-addServer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addServer.component.html',
  styleUrls: ['./addServer.component.css']
})
export class AddServerComponent {
  nombre = '';
  ip = '';

  servers: any[] = [];
  showForm = false;
  editingId: number | null = null; // <-- Si no es null, estamos en modo edición
  isSubmitting = false;

  alertVisible = false;
  alertType: 'success' | 'error' | null = null;
  alertMessage = '';

  isSaving = false;
  isDeleting = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
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

  resetForm() {
    this.nombre = '';
    this.ip = '';
    this.editingId = null;
    this.showForm = false;
  }

  startEdit(server: any) {
    this.showForm = true;
    this.editingId = server.id_server; // 👈 usa la clave real
    this.nombre = server.name;
    this.ip = server.url;
  }

  cancelEdit() {
    this.resetForm();
  }

  confirmDelete(id: number) {
    if (!confirm('¿Seguro que deseas eliminar este servidor?')) return;
    this.deleteServer(id);
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

    this.apiService.deleteServer(id, id_user).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showAlert('success', 'Servidor eliminado con éxito ✅');
        this.loadServers();
      },
      error: (err) => {
        this.isDeleting = false;
        console.error('❌ Error al eliminar servidor:', err);
        this.showAlert('error', 'Error al eliminar servidor');
      }
    });
  }

  // ==============================
  //        GUARDAR / EDITAR
  // ==============================
  async onSubmit(event: Event) {
    event.preventDefault();
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (!this.nombre || !this.ip) {
      this.showAlert('error', 'Por favor completa todos los campos obligatorios');
      this.isSubmitting = false;
      return;
    }

    this.isSaving = true; // 👈 Mostrar overlay

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
            // No bloqueamos todo el proceso por un fallo al obtener la lista de usuarios;
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
      url: this.ip,
      id_user: matchedUser ? matchedUser.id : null,
    };

    try {
      if (this.editingId) {
        // MODO EDICIÓN
        //this.isSaving = true; // 👈 Mostrar overlay

        this.apiService.updateServer(this.editingId, payload).subscribe({
          next: () => {
            this.isSaving = false; // 👈 Ocultar overlay
            this.showAlert('success', 'Servidor actualizado con éxito');
            this.resetForm();
            this.loadServers();
            this.isSubmitting = false;
          },
          error: (err) => {
            this.isSaving = false; // 👈 Ocultar overlay
            console.error('❌ Error al actualizar servidor:', err);
            this.showAlert('error', 'Error al actualizar servidor');
            this.isSubmitting = false;
          }
        });

      } else {
        // MODO CREAR
        //this.isSaving = true; // 👈 Mostrar overlay

        this.apiService.addServer(payload).subscribe({
          next: () => {
            this.isSaving = false; // 👈 Ocultar overlay
            this.showAlert('success', 'Servidor registrado con éxito ✅');
            this.resetForm();
            this.loadServers();
            this.isSubmitting = false;
          },
          error: (err) => {
            this.isSaving = false; // 👈 Ocultar overlay
            console.error('❌ Error al registrar servidor:', err);
            this.showAlert('error', 'Error al registrar servidor');
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
