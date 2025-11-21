import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CommonModule, NgForOf, NgClass } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { lastValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';
import { SidenavService } from '../../services/sidenav.service';

@Component({
  selector: 'app-addDB',
  standalone: true,
  imports: [CommonModule, FormsModule, NgForOf, NgClass],
  templateUrl: './addDB.component.html',
  styleUrls: ['./addDB.component.css']
})
export class AddDBComponent implements OnInit, OnDestroy{
  name = '';
  host = '';
  port: number = 0;
  user = '';
  password = '';
  auth_db = '';
  name_db = '';
  users: any = null;
  db: any = null;
  isSubmitting = false;

  databases: any[] = [];
  showForm = false;
  editingId: number | null = null; // <-- si no es null, estamos en modo edición

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

    closeAlert() {
    this.alertVisible = false;
  }

  showAlert(type: 'success' | 'error', message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.alertVisible = true;
    setTimeout(() => (this.alertVisible = false), 4000);
  }

  ngOnInit() {
    this.loadDatabases();

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

  loadDatabases() {
    this.apiService.getDatabases().subscribe({
      next: (data: any) => {
        // si tu API devuelve { data: [...] } ajusta aquí
        this.databases = Array.isArray(data) ? data : (data.data ?? []);
      },
      error: (err) => console.error('❌ Error al cargar bases de datos:', err)
    });
  }

  resetForm() {
    this.name = '';
    this.host = '';
    this.port = 0;
    this.user = '';
    this.password = '';
    this.auth_db = '';
    this.name_db = '';
    this.editingId = null;
    this.showForm = false;
  }

  // iniciar edición: carga los campos en el formulario
  startEdit(db: any) {
    this.showForm = true;
    this.editingId = db.id;
    this.name = db.name;
    this.host = db.host;
    this.port = Number(db.port);
    this.user = db.user;
    // para password: no lo exponemos. Pedimos al usuario que ingrese una nueva contraseña si desea cambiarla.
    this.password = '';
    this.auth_db = db.auth_db;
    this.name_db = db.name_db;
    // opcional: hacer scroll al formulario o dar foco
  }

  // cancelar edición (vuelve a modo crear)
  cancelEdit() {
    this.resetForm();
  }

  // confirmar eliminación con confirm nativo (puedes reemplazar por modal)
  // confirmDelete(id: number) {
  //   if (!confirm('¿Seguro que deseas eliminar esta base de datos?')) return;
  //   this.deleteDatabase(id);
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

    this.deleteDatabase(this.deleteTargetId);
    this.deleteTargetId = null;
  }

  async deleteDatabase(id: number) {
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

    this.apiService.deleteDatabase(id, id_user).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showAlert('success', 'Base de datos eliminada con éxito ✅');
        this.loadDatabases();
      },
      error: (err) => {
        this.isDeleting = false;
        console.error('❌ Error al eliminar base de datos:', err);
        this.showAlert('error', 'Error al eliminar base de datos');
      }
    });
  }

  // onSubmit ahora decide entre crear o actualizar
  async onSubmit(event: Event) {
    event.preventDefault();
    console.log('🔵 onSubmit iniciado');
    
    if (this.isSubmitting) {
      console.log('⚠️ Ya se está procesando una petición');
      return;
    }
    
    this.isSubmitting = true;
    console.log('✅ isSubmitting = true');

    // Validaciones adicionales en frontend
    if (!this.name || this.name.trim().length < 3) {
      console.log('❌ Validación fallida: nombre');
      this.showAlert('error', 'El nombre debe tener al menos 3 caracteres');
      this.isSubmitting = false;
      return;
    }

    if (this.port < 1 || this.port > 65535) {
      console.log('❌ Validación fallida: puerto');
      this.showAlert('error', 'El puerto debe estar entre 1 y 65535');
      this.isSubmitting = false;
      return;
    }

    if (!this.user || this.user.trim().length < 3) {
      console.log('❌ Validación fallida: usuario');
      this.showAlert('error', 'El usuario es obligatorio y debe tener al menos 3 caracteres');
      this.isSubmitting = false;
      return;
    }

    if (!this.editingId && (!this.password || this.password.trim().length < 6)) {
      console.log('❌ Validación fallida: contraseña');
      this.showAlert('error', 'La contraseña es obligatoria (mínimo 6 caracteres)');
      this.isSubmitting = false;
      return;
    }

    if (!this.auth_db || !this.name_db) {
      console.log('❌ Validación fallida: auth_db o name_db');
      this.showAlert('error', 'Los campos Auth DB y Nombre BD son obligatorios');
      this.isSubmitting = false;
      return;
    }

    if (!this.name || !this.host || !this.port || !this.user || !this.name_db) {
      console.log('❌ Validación fallida: campos obligatorios');
      this.showAlert('error', 'Por favor completa todos los campos obligatorios');
      this.isSubmitting = false;
      return;
    }

    console.log('✅ Todas las validaciones pasaron');
    this.isSaving = true;

    console.log('🔵 Obteniendo usuario actual...');
    const currentUser = this.authService.getUser();
    let matchedUser: any = null;
    
    if (currentUser && currentUser.name) {
      console.log('👤 Usuario cargado. Nombre:', currentUser.name);
      try {
        console.log('🔵 Obteniendo lista de usuarios...');
        const users = await lastValueFrom(this.apiService.getUsers());
        console.log('✅ Usuarios obtenidos:', users);
        // Varias APIs devuelven directamente un array o un objeto { data: [...] }
        const usersArray = Array.isArray(users) ? users : (users && Array.isArray(users.data) ? users.data : []);
        matchedUser = usersArray.find((u: any) => u && u.name === currentUser.name) ?? null;
        console.log('👤 Usuario emparejado:', matchedUser);
      } catch (err) {
        console.error('❌ Error obteniendo usuarios para emparejar:', err);
        this.isSaving = false;
        this.isSubmitting = false;
        this.showAlert('error', 'Error al obtener información del usuario. Intenta de nuevo.');
        return;
      }
    } else {
      console.log('⚠️ No hay usuario autenticado. Cerrando sesión.');
      this.authService.logout();
      this.isSaving = false;
      this.isSubmitting = false;
      return; // Salimos porque no hay usuario con el que asociar la acción
    }

    const payload: any = {
      name: this.name,
      host: this.host,
      port: Number(this.port),
      user: this.user,
      auth_db: this.auth_db,
      name_db: this.name_db,
      id_user: matchedUser ? matchedUser.id : null,
    };

    // Solo incluir password si el usuario escribió algo (para no forzar a cambiarla)
    if (this.password && this.password.trim().length > 0) {
      payload.password = this.password;
    }

    console.log('📦 Payload preparado:', { ...payload, password: payload.password ? '***' : 'no incluida' });

    try {
      if (this.editingId) {
        console.log('✏️ Modo edición - ID:', this.editingId);
        // MODO EDICIÓN
        this.apiService.updateDatabase(this.editingId, payload).subscribe({
          next: (res: any) => {
            this.isSaving = false;
            this.showAlert('success', 'Base de datos actualizada con éxito');
            this.resetForm();
            this.loadDatabases();
            this.isSubmitting = false;
          },
          error: (err) => {
            console.error('❌ Error al actualizar:', err);
            if (err.status === 422) {
              this.isSaving = false;
              this.showAlert('error', 'Error de validación al actualizar. Revisa los datos.');
            } else {
              this.isSaving = false;
              this.showAlert('error', 'Error al actualizar la base de datos');
            }
            this.isSubmitting = false;
          }
        });
      } else {
        // MODO CREAR
        console.log('➕ Modo crear - Iniciando petición...');
        // password es obligatorio para crear, así que en este caso debe incluirse (ya lo validamos arriba)
        if (!payload.password && (!this.password || this.password.trim().length === 0)) {
          console.log('❌ Error: contraseña faltante en modo crear');
          this.isSaving = false;
          this.showAlert('error', 'La contraseña es obligatoria para crear la base de datos.');
          this.isSubmitting = false;
          return;
        }
        // incluir password si no fue añadida anteriormente
        if (!payload.password && this.password) {
          payload.password = this.password;
        }

        console.log('🚀 Llamando a apiService.addDatabase...');
        this.apiService.addDatabase(payload).subscribe({
          next: (res: any) => {
            console.log('✅ Base de datos registrada exitosamente:', res);
            this.isSaving = false;
            this.showAlert('success', 'Base de datos registrada con éxito ✅');
            this.resetForm();
            this.loadDatabases();
            this.isSubmitting = false;
          },
          error: (err) => {
            console.error('❌ Error al registrar base de datos:', err);
            console.error('❌ Detalles del error:', {
              status: err.status,
              statusText: err.statusText,
              message: err.message,
              error: err.error
            });
            this.isSaving = false;
            if (err.status === 422) {
              this.showAlert('error', 'Error de validación. Revisa los datos ingresados.');
            } else if (err.status === 401) {
              this.showAlert('error', 'No autorizado. Por favor, inicia sesión nuevamente.');
            } else {
              this.showAlert('error', `Error al registrar: ${err.message || 'Error desconocido'}`);
            }
            this.isSubmitting = false;
          }
        });
      }
    } catch (err) {
      console.error('❌ onSubmit error:', err);
      this.isSaving = false;
      this.showAlert('error', 'Ocurrió un error inesperado');
      this.isSubmitting = false;
    }
  }
}