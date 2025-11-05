import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

type FilterType = 'all' | 'pending' | 'authorized' | 'rejected';
type NotificationType = 'success' | 'error';

@Component({
    selector: 'app-permission',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './permission.component.html',
})
export class PermissionComponent implements OnInit {
    
    users: User[] = [];
    filteredUsers: User[] = [];
    currentFilter: FilterType = 'all';
    showNotification: boolean = false;
    notificationMessage: string = '';
    notificationType: NotificationType = 'success';
    loading: boolean = false;


    constructor(
        private apiService: ApiService,
        private authService: AuthService
      ) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    private loadUsers(): void {
        this.loading = true;
        this.authService.getAllUsers().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.users = response.data;
                    this.filterUsers();
                } else {
                    this.showNotificationMessage('Error al cargar usuarios', 'error');
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error cargando usuarios:', error);
                this.showNotificationMessage('Error al cargar usuarios', 'error');
                this.loading = false;
            }
        });
    }

    setFilter(filter: FilterType): void {
        this.currentFilter = filter;
        this.filterUsers();
    }

    private filterUsers(): void {
        if (this.currentFilter === 'all') {
            this.filteredUsers = this.users;
        } else {
            this.filteredUsers = this.users.filter(user => user.authorization_status === this.currentFilter);
        }
    }

    isActiveFilter(filter: FilterType): boolean {
        return this.currentFilter === filter;
    }

    getStatusBadgeClass(status: User['authorization_status']): string {
        const classes = {
            pending: 'bg-yellow-100 text-yellow-800',
            authorized: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[status]}`;
    }

    getStatusText(status: User['authorization_status']): string {
        const texts = {
            pending: 'Pendiente',
            authorized: 'Autorizado',
            rejected: 'Rechazado'
        };
        return texts[status];
    }

    handleAccept(userId: number): void {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        this.loading = true;
        this.authService.authorizeUser(userId).subscribe({
            next: (response) => {
                if (response.success) {
                    // Actualizar el usuario en la lista local
                    user.authorization_status = 'authorized';
                    this.filterUsers();
                    this.showNotificationMessage(`Petición de ${user.name} aceptada`, 'success');
                    // Registrar log de forma asíncrona
                    this.logAdminAction(`Se le autorizó el acceso al usuario {user}`, user.name);
                } else {
                    this.showNotificationMessage('Error al autorizar usuario', 'error');
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error autorizando usuario:', error);
                this.showNotificationMessage('Error al autorizar usuario', 'error');
                this.loading = false;
            }
        });
    }

    handleReject(userId: number): void {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        this.loading = true;
        this.authService.rejectUser(userId).subscribe({
            next: (response) => {
                if (response.success) {
                    // Actualizar el usuario en la lista local
                    user.authorization_status = 'rejected';
                    this.filterUsers();
                    this.showNotificationMessage(`Petición de ${user.name} rechazada`, 'error');
                    // Registrar log de forma asíncrona
                    this.logAdminAction(`Se le denegó la petición de acceso al usuario {user}`, user.name);
                } else {
                    this.showNotificationMessage('Error al rechazar usuario', 'error');
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error rechazando usuario:', error);
                this.showNotificationMessage('Error al rechazar usuario', 'error');
                this.loading = false;
            }
        });
    }

    private showNotificationMessage(message: string, type: NotificationType): void {
        this.notificationMessage = message;
        this.notificationType = type;
        this.showNotification = true;
        
        setTimeout(() => {
            this.showNotification = false;
        }, 3000);
    }

    get hasFilteredUsers(): boolean {
        return this.filteredUsers.length > 0;
    }

    trackByUserId(index: number, user: User): number {
        return user.id;
    }

    // Método privado para registrar logs de acciones de administrador
    private logAdminAction(action: string, targetUserName: string): void {
        const currentUser = this.authService.getUser();
        if (!currentUser) {
            console.warn('⚠️ No hay usuario autenticado para registrar log');
            return;
        }

        // Usar el usuario actual directamente sin necesidad de buscar en la API
        const logData = {
            id_user: currentUser.id,
            id_server: null,
            id_connection: null,
            id_db: null,
            id_simulation: null,
            description: action.replace('{user}', targetUserName)
        };

        // Enviar log de forma asíncrona sin bloquear la UI
        this.apiService.storeLogs(logData).subscribe({
            next: () => console.log('✅ Log guardado correctamente'),
            error: (err) => console.error('❌ Error al guardar log:', err),
        });
    }

    handleMakeAdmin(userId: number): void {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        this.loading = true;
        this.authService.makeAdmin(userId).subscribe({
            next: (response) => {
                if (response.success) {
                    user.role = 'admin';
                    this.showNotificationMessage(`${user.name} ahora es administrador`, 'success');
                    // Registrar log de forma asíncrona
                    this.logAdminAction(`Se le concedieron los permisos de administrador al usuario {user}`, user.name);
                } else {
                    this.showNotificationMessage('Error al asignar rol de administrador', 'error');
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error haciendo admin:', error);
                this.showNotificationMessage('Error al hacer admin', 'error');
                this.loading = false;
            }
        });
    }

    handleRemoveAdmin(userId: number): void {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        this.loading = true;
        this.authService.removeAdmin(userId).subscribe({
            next: (response) => {
                if (response.success) {
                    user.role = 'user';
                    this.showNotificationMessage(`${user.name} ya no es administrador`, 'success');
                    // Registrar log de forma asíncrona
                    this.logAdminAction(`Se le removió los permisos de administrador al usuario {user}`, user.name);
                } else {
                    this.showNotificationMessage('Error al quitar rol de administrador', 'error');
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error quitando admin:', error);
                this.showNotificationMessage('Error al quitar admin', 'error');
                this.loading = false;
            }
        });
    }

    removeAuthorization(userId: number): void {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        this.loading = true;
        this.authService.rejectUser(userId).subscribe({
            next: (response) => {
                if (response.success) {
                    // Actualizar el usuario en la lista local
                    user.authorization_status = 'rejected';
                    this.filterUsers();
                    this.showNotificationMessage(`Petición de ${user.name} removida`, 'error');
                    // Registrar log de forma asíncrona
                    this.logAdminAction(`Se le removió la autorización de acceso al usuario {user}`, user.name);
                } else {
                    this.showNotificationMessage('Error al remover usuario', 'error');
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error removiendo autorización:', error);
                this.showNotificationMessage('Error al remover autorización', 'error');
                this.loading = false;
            }
        });
    }
}