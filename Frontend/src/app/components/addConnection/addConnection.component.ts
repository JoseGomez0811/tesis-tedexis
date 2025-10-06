import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgForOf } from '@angular/common';

@Component({
  selector: 'app-addConnection',
  imports: [CommonModule, FormsModule, NgForOf],
  templateUrl: './addConnection.component.html',
})
export class AddConnectionComponent implements OnInit{
  servers: any[] = [];
  selectedServer = '';
  puerto = '';
  nombre = '';
  conexion = '';

  constructor(private apiService: ApiService) {}

  onSubmit(event: Event) {
    event.preventDefault();

    // Asumiendo que 'this.servers' es un arreglo de objetos y 'this.selectedServer' es el nombre del servidor.


    const id_server = this.servers.find(server => server.name === this.selectedServer)?.id_server ?? null;

    const newConnection = {
      //server: this.selectedServer,
      name: this.nombre,
      type: this.conexion,
      port: this.puerto ? parseInt(this.puerto, 10) : null,
      path: undefined, // Si tienes un campo path opcional, puedes dejarlo así o eliminarlo si no lo usas
      id_server: id_server,
    };

    this.apiService.addConnection(newConnection).subscribe({
      next: res => {
        alert('Conexión añadida con éxito ✅');
        console.log(res);
        this.selectedServer = '';
        this.nombre = '';
        this.puerto = '';
        this.conexion = '';
      },
      error: err => {
        alert('Error al añadir conexión ❌');
        console.log(this.conexion)
        console.log(id_server)
        console.error(err);
      }
    });
  }

  ngOnInit(): void {
    this.apiService.getServers().subscribe({
      next: (res: any) => {
        console.log('Servidores recibidos:', res);
        this.servers = Array.isArray(res) ? res : res.data ?? [];
      },
      error: err => console.error('Error cargando servidores:', err)
    });
  }
}