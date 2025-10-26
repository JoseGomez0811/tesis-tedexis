import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-addServer',
  imports: [CommonModule, FormsModule],
  templateUrl: './addServer.component.html',
  styleUrl: './addServer.component.css'
})
export class AddServerComponent {
  nombre = '';
  ip = '';

  users: any = null;
  server: any = null;

  isSubmitting = false;

  googleUserData = {
    fullName: '',
    email: '',
  };

  alertVisible = false;
  alertType: 'success' | 'error' | null = null;
  alertMessage = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  closeAlert() {
    this.alertVisible = false;
  }

  showAlert(type: 'success' | 'error', message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.alertVisible = true;

    // Se oculta con una pequeña transición
    setTimeout(() => {
      this.alertVisible = false;
    }, 4000);
  }

  async onSubmit(event: Event) {
    event.preventDefault();

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

    const newServer = {
      name: this.nombre,
      url: this.ip,
      id_user: matchedUser ? matchedUser.id : null,
    };

    this.apiService.addServer(newServer).subscribe({
      next: res => {
        this.showAlert('success','Servidor añadido con éxito ✅');
        console.log(res);
        this.nombre = '';
        this.ip = '';
      },
      error: err => {
        this.showAlert('error','Error al añadir servidor ❌');
        console.error(err);
      }
    });
  }
}