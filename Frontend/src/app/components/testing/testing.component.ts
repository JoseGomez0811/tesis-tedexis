import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgFor, NgForOf } from '@angular/common';

@Component({
  selector: 'app-testing',
  standalone: true, // 👈 NECESARIO en standalone components
  imports: [CommonModule, FormsModule, NgForOf], // 👈 ngFor y ngModel funcionan aquí
  templateUrl: './testing.component.html',
  styleUrls: ['./testing.component.css']
})
export class TestingComponent implements OnInit {
  
  servers: any[] = [];
  db: any[] = [];

  selectedServer = '';
  selectedDB = '';
  tipoConexion = '';
  tipoSimulacion = '';

  // Campos de simulación (nuevo)
  numeroTelefono = '';
  mensaje = '';
  cantidad: number | null = null;
  systemId = '';

  // Campos de simulación (reuso)
  baseDeDatos = '';
  cantidadReuso: number | null = null;

  showNuevoFields = false;
  showReusoFields = false;

  constructor(private apiService: ApiService) {}

  // ngOnInit(): void {
  //   this.loadServers();
  // }

  ngOnInit(): void {
    this.apiService.getServers().subscribe({
      next: (res: any) => {
        console.log('Servidores recibidos:', res);
        this.servers = Array.isArray(res) ? res : res.data ?? [];
      },
      error: err => console.error('Error cargando servidores:', err)
    });

    this.apiService.getDatabases().subscribe({
      next: (res: any) => {
        console.log('Bases de Datos recibidas:', res);
        this.db = Array.isArray(res) ? res : res.data ?? [];
      },
      error: err => console.error('Error cargando bases de datos:', err)
    })
  }

  loadServers() {
    this.apiService.getServers().subscribe({
      next: (res: any) => {
        console.log('Servidores recibidos:', res);
        // Ajusta según la estructura de tu API
        this.servers = Array.isArray(res) ? res : res.data ?? [];
      },
      error: err => {
        console.error('Error cargando servidores:', err);
      }
    });
  }

  loadDB() {
    this.apiService.getDatabases().subscribe({
      next: (res: any) => {
        console.log('Bases de datos recibidas:', res);
        // Ajusta según la estructura de tu API
        this.db = Array.isArray(res) ? res : res.data ?? [];
      },
      error: err => {
        console.error('Error cargando bases de datos:', err);
      }
    });
  }


  toggleFields(event: any) {
    const value = event.target.value;
    this.showNuevoFields = value === 'nuevo';
    this.showReusoFields = value === 'reuso';
    this.tipoSimulacion = value;
  }

  onSubmit(event: Event) {
    event.preventDefault();

    const payload: any = {};
    if (this.showNuevoFields) {
      payload.number = this.numeroTelefono;
      payload.text = this.mensaje;
      payload.amount = this.cantidad;
      payload.system_id = this.systemId;
    } else if (this.showReusoFields) {
      payload.amount = this.cantidadReuso;
      payload.database = this.db;
    }

    const simulation = {
      server_name: this.selectedServer,
      connection_type: this.tipoConexion,
      simulation_type: this.tipoSimulacion,
      payload: payload,
      metadata: {
        headers: { 'X-Client': 'angular-ui' },
        method: 'post'
      }
    };

    this.apiService.sendSimulation(simulation).subscribe({
      next: res => {
        if (res.success) {
          alert('✅ Simulación enviada con éxito');
        } else {
          alert('❌ Fallo en simulación: ' + res.error);
        }
        console.log(res);
      },
      error: err => {
        alert('Error de red enviando simulación ❌');
        console.error(err);
      }
    });
  }
}