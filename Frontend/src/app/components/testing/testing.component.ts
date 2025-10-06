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
  collection: any[] = [];
  connections: any[] = [];
  filteredConnections: any[] = [];

  selectedServer = '';
  selectedConnection = '';
  selectedDB = '';
  selectedCollection = '';
  tipoConexion = '';
  tipoSimulacion = '';
  showQueueField = false;
  //showPasswordFieldReuso = false;
  //showSystemIDField = false;
  nombreCola = '';
  dbPassword = '';
  dbSystemID = '';

  // Campos de simulación (nuevo)
  numeroTelefono = '';
  mensaje = '';
  cantidad: number | null = null;
  systemId = '';
  password = '';
  sc = '';
  encoding = '';

  // Campos de simulación (reuso)
  baseDeDatos = '';
  cantidadReuso: number | null = null;

  showNuevoFields = false;

  get selectedConnectionType(): string {
    const selected = this.filteredConnections.find(conn => conn.name === this.selectedConnection);
    return selected && selected.type ? selected.type.toLowerCase() : '';
  }

  get showCamposNuevo(): boolean {
    return this.showNuevoFields && (this.selectedConnectionType === 'smpp' || this.selectedConnectionType === 'mq');
  }

  get showPasswordField(): boolean {
    return this.showNuevoFields && this.selectedConnectionType === 'smpp';
  }
  showReusoFields = false;

  get showCamposReuso(): boolean {
    return this.showReusoFields && (this.selectedConnectionType === 'smpp' || this.selectedConnectionType === 'mq');
  }
  get showPasswordFieldReuso(): boolean {
    return this.showReusoFields && this.selectedConnectionType === 'smpp';
  }
  get showSystemIDField(): boolean {
    return this.showReusoFields && this.selectedConnectionType === 'smpp';
  }

  constructor(private apiService: ApiService) {}

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
    });

    this.apiService.getConnection().subscribe({
      next: (res: any) => {
        console.log('Conexiones recibidas:', res);
        this.connections = Array.isArray(res) ? res : res.data ?? [];
        this.filterConnections();
      },
      error: err => console.error('Error cargando conexiones:', err)
    });
  }

  onServerChange() {
    this.filterConnections();
    this.selectedConnection = '';
    this.showQueueField = false;
    
    // Resetear el tipo de simulación
    this.tipoSimulacion = '';
    this.showNuevoFields = false;
    this.showReusoFields = false;
  }

  filterConnections() {
    const id_server = this.servers.find(server => server.name === this.selectedServer)?.id_server;
    this.filteredConnections = this.connections.filter(conn => conn.id_server === id_server);
  }

  toggleFields(event: any) {
    const value = event.target.value;
    this.showNuevoFields = value === 'nuevo';
    this.showReusoFields = value === 'reuso';
    this.tipoSimulacion = value;
  }

  onConnectionChange() {
    const selected = this.filteredConnections.find(conn => conn.name === this.selectedConnection);
    this.showQueueField = selected && selected.type && selected.type.toLowerCase() === 'mq';
    if (!this.showQueueField) {
      this.nombreCola = '';
    }
    // Resetear el tipo de simulación a vacío
    this.tipoSimulacion = '';
    this.showNuevoFields = false;
    this.showReusoFields = false;
  }

  onDatabaseChange() {
    const db = this.db.find(d => d.name === this.selectedDB);
    if (!db || !db.id) {
      console.warn("⚠️ No se encontró la base de datos seleccionada");
      this.collection = [];
      return;
    }

    this.apiService.getCollections(db.id).subscribe({
      next: (res: any) => {
        console.log('Colecciones recibidas:', res);
        //this.collection = Array.isArray(res.collections) ? res.collections : [];
        this.collection = Array.isArray(res) ? res : res.data ?? [];
      },
      error: err => {
        console.error('Error cargando colecciones:', err);
        this.collection = [];
      }
    });
  }


  onSubmit(event: Event) {
    event.preventDefault();

    //OBTENER PUERTO, HOST, ETC PARA LA SIMULACION
    const selectedServer = this.servers.find(server => server.name === this.selectedServer);
    const serverUrl = selectedServer?.url; // o el campo que contenga la URL
    const selectedConnection = this.connections.find(connection => connection.name === this.selectedConnection);
    const connectionPort = selectedConnection?.port; // o el campo que contenga la URL


    const simulationData: any = {
        hostServer: serverUrl,
        typeConnection: connectionPort,
        nameQueue: this.nombreCola, // Debes agregar este campo o obtenerlo del formulario
    };

    
    // Agregar campos específicos según el modo
    if (this.showNuevoFields) {
      simulationData.systemID = this.systemId;
      simulationData.password = this.password;
      simulationData.phoneNumber = this.numeroTelefono;
      simulationData.message = this.mensaje;
      simulationData.number = this.cantidad;
      simulationData.shortCode = this.sc;
      simulationData.encoding = this.encoding;
    }else if (this.showReusoFields) {
      simulationData.number = this.cantidadReuso;
      simulationData.database = this.db;
      simulationData.systemID = this.systemId;
      simulationData.password = this.password;
    }

    this.apiService.sendSimulation(simulationData).subscribe({
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