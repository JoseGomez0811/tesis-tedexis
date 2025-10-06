import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-addServer',
  imports: [FormsModule],
  templateUrl: './addServer.component.html',
  styleUrl: './addServer.component.css'
})
export class AddServerComponent {
  nombre = '';
  ip = '';

  constructor(private apiService: ApiService) {}

  onSubmit(event: Event) {
    event.preventDefault();

    const newServer = {
      name: this.nombre,
      url: this.ip,
    };

    this.apiService.addServer(newServer).subscribe({
      next: res => {
        alert('Servidor añadido con éxito ✅');
        console.log(res);
        this.nombre = '';
        this.ip = '';
      },
      error: err => {
        alert('Error al añadir servidor ❌');
        console.error(err);
      }
    });
  }
}