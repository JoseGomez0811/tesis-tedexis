import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgForOf } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-testing',
  standalone: true,
  imports: [CommonModule, FormsModule, NgForOf],
  templateUrl: './testing.component.html',
  styleUrls: ['./testing.component.css']
})
export class TestingComponent implements OnInit {
  servers: any[] = [];
  db: any[] = [];
  collection: any[] = [];
  documents: any[] = [];
  connections: any[] = [];
  filteredConnections: any[] = [];
  selectedDocument: any = null;
  phoneNumbers: any[] = [];

  users: any = null;

  googleUserData = {
    fullName: '',
    email: '',
  };

  selectedServer = '';
  selectedConnection = '';
  selectedDB = '';
  selectedCollection = '';
  tipoConexion = '';
  tipoSimulacion = '';
  showQueueField = false;
  nombreCola = '';
  dbPassword = '';
  dbSystemID = '';

  // Campos nuevo
  numeroTelefono = '';
  mensaje = '';
  cantidad: number | null = null;
  systemId = '';
  password = '';
  sc = '';
  encoding = '';

  // Campos reuso
  baseDeDatos = '';
  cantidadReuso: number | null = null;

  showNuevoFields = false;
  showReusoFields = false;

  alertVisible = false;
  alertType: 'success' | 'error' | null = null;
  alertMessage = '';
  isSubmitting = false; // Nueva variable para controlar estado de envío

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

    setTimeout(() => {
      this.alertVisible = false;
    }, 4000);
  }

  ngOnInit(): void {
    this.apiService.getServers().subscribe({
      next: (res: any) => {
        this.servers = Array.isArray(res) ? res : res.data ?? [];
      },
      error: err => console.error('Error cargando servidores:', err)
    });

    this.apiService.getDatabases().subscribe({
      next: (res: any) => {
        this.db = Array.isArray(res) ? res : res.data ?? [];
      },
      error: err => console.error('Error cargando bases de datos:', err)
    });

    this.apiService.getConnection().subscribe({
      next: (res: any) => {
        this.connections = Array.isArray(res) ? res : res.data ?? [];
        this.filterConnections();
      },
      error: err => console.error('Error cargando conexiones:', err)
    });
  }

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

  get showCamposReuso(): boolean {
    return this.showReusoFields && (this.selectedConnectionType === 'smpp' || this.selectedConnectionType === 'mq');
  }

  get showPasswordFieldReuso(): boolean {
    return this.showReusoFields && this.selectedConnectionType === 'smpp';
  }

  get showSystemIDField(): boolean {
    return this.showReusoFields && this.selectedConnectionType === 'smpp';
  }

  onServerChange() {
    this.filterConnections();
    this.selectedConnection = '';
    this.showQueueField = false;
    this.tipoSimulacion = '';
    this.showNuevoFields = false;
    this.showReusoFields = false;
  }

  filterConnections() {
    const id_server = this.servers.find(server => server.name === this.selectedServer)?.id_server;
    this.filteredConnections = this.connections.filter(conn => conn.id_server === id_server);
  }

  toggleFields(event: any) {
    const value = event.target?.value ?? this.tipoSimulacion;
    this.showNuevoFields = value === 'nuevo';
    this.showReusoFields = value === 'reuso';
    this.tipoSimulacion = value;
  }

  onConnectionChange() {
    const selected = this.filteredConnections.find(conn => conn.name === this.selectedConnection);
    this.showQueueField = selected && selected.type && selected.type.toLowerCase() === 'mq';
    if (!this.showQueueField) this.nombreCola = '';

    this.tipoSimulacion = '';
    this.showNuevoFields = false;
    this.showReusoFields = false;
  }

  onDatabaseChange() {
    const db = this.db.find(d => d.name === this.selectedDB);
    if (!db || !db.id) {
      this.collection = [];
      return;
    }

    this.apiService.getCollections(db.id).subscribe({
      next: (res: any) => {
        this.collection = Array.isArray(res) ? res : res.data ?? [];
      },
      error: err => {
        console.error('Error cargando colecciones:', err);
        this.collection = [];
      }
    });
  }

  onCollectionChange() {
    const collectionName = this.selectedCollection;
    const dbObj = this.db.find(d => d.name === this.selectedDB);

    if (!dbObj || !dbObj.id || !collectionName) {
      this.documents = [];
      return;
    }

    this.apiService.getCollectionData(dbObj.id, collectionName).subscribe({
      next: (res: any) => {
        this.documents = Array.isArray(res) ? res : res.data ?? [];
        this.selectedDocument = null;
      },
      error: err => {
        console.error('Error cargando documentos:', err);
        this.documents = [];
        this.selectedDocument = null;
      }
    });
  }

  // --- Utilidades para IDs ---
  getDocId(obj: any): string {
    if (!obj) return '';
    const candidate = obj._id ?? obj;
    if (!candidate) return '';

    if (typeof candidate === 'string') return candidate;

    if (typeof candidate === 'object') {
      if (typeof candidate.$oid === 'string') return candidate.$oid;
      const vals = Object.values(candidate);
      for (const v of vals) {
        if (typeof v === 'string' && /^[0-9a-fA-F]{8,}$/.test(v)) return v;
      }
      try {
        return JSON.stringify(candidate);
      } catch {
        return String(candidate);
      }
    }

    return String(candidate);
  }

  docIsSelected(doc: any): boolean {
    if (!this.selectedDocument) return false;
    return this.getDocId(this.selectedDocument) === this.getDocId(doc);
  }

  // Seleccionar documento y cargar detalle desde API
  selectDocument(doc: any) {
    const collectionName = this.selectedCollection;
    const dbObj = this.db.find(d => d.name === this.selectedDB);
    if (!dbObj || !dbObj.id || !collectionName) {
      console.error('⚠️ No se encontró DB o colección para la llamada API.');
      return;
    }

    const docIdToUse = this.getDocId(doc);
    if (!docIdToUse) {
      console.error('⚠️ _id inválido en el documento:', doc);
      return;
    }

    console.log('📄 Cargando documento con ID:', docIdToUse);

    this.apiService.getDocument(dbObj.id, collectionName, docIdToUse).subscribe({
      next: (res: any) => {
        this.selectedDocument = res;
        console.log('✅ Documento detallado cargado:', res);
        this.systemId = res.SystemID || this.systemId || '';
        this.numeroTelefono = res.PhoneNumber;
        this.mensaje = res.Text; 
        this.sc = res.ShortCode;
        this.encoding = res.Encoding;
      },
      error: err => {
        console.error('❌ Error cargando el documento detallado:', err);
        this.selectedDocument = null;
      }
    });
  }

  processPhoneNumbers() {
    if (!this.numeroTelefono || this.numeroTelefono.trim() === '') {
      this.phoneNumbers = [];
      return;
    }

    this.phoneNumbers = this.numeroTelefono
      .split(',')
      .map(num => num.trim())
      .filter(num => num !== '');

    console.log('📞 Números de teléfono procesados:', this.phoneNumbers);
  }

  resetForm() {
    this.selectedServer = '';
    this.selectedConnection = '';
    this.selectedDB = '';
    this.selectedCollection = '';
    this.tipoConexion = '';
    this.tipoSimulacion = '';
    this.showQueueField = false;
    this.nombreCola = '';
    this.dbPassword = '';
    this.dbSystemID = '';
    this.numeroTelefono = '';
    this.phoneNumbers = [];
    this.mensaje = '';
    this.cantidad = null;
    this.systemId = '';
    this.password = '';
    this.sc = '';
    this.encoding = '';
    this.baseDeDatos = '';
    this.cantidadReuso = null;
    this.showNuevoFields = false;
    this.showReusoFields = false;
    this.isSubmitting = false;
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    if (this.isSubmitting) {
      this.showAlert('error', 'Ya hay una simulación en proceso. Por favor espera.');
      return;
    }

    this.isSubmitting = true;
    this.showAlert('success', 'Iniciando envío de simulaciones...');

    // Procesar los números ingresados antes de enviar
    this.processPhoneNumbers();

    const selectedServer = this.servers.find(server => server.name === this.selectedServer);
    const serverUrl = selectedServer?.url;
    const serverID = selectedServer?.id_server;
    const selectedConnection = this.connections.find(connection => connection.name === this.selectedConnection);
    const connectionPort = selectedConnection?.port;
    const connectionType = selectedConnection?.type;
    const connectionID = selectedConnection?.id_connection;
    const selectedDatabase = this.db.find(database => database.name === this.selectedDB);
    const dbId = selectedDatabase?.id;

    const user = this.authService.getUser();
    if (user) {
      const userId = user.name;
      console.log('👤 Usuario cargado. Nombre:', userId);
    } else {
      console.log('⚠️ No hay usuario autenticado');
    }

    const storeSimulation: any = {
      id_server: serverID,
      id_connection: connectionID,
      nameQueue: this.nombreCola,
    };

    const simulationDataBase: any = {
      hostServer: serverUrl,
      portConnection: connectionPort,
      typeConnection: connectionType,
      nameQueue: this.nombreCola,
    };

    try {
      // 🔹 SIMULACIÓN NUEVA
      if (this.showNuevoFields) {
        if (this.phoneNumbers.length === 0) {
          this.showAlert('error', 'Por favor, ingrese al menos un número de teléfono válido.');
          this.isSubmitting = false;
          return;
        }

        let successfulSimulations = 0;
        let failedSimulations = 0;

        // Ejecutar simulaciones de forma secuencial
        for (let index = 0; index < this.phoneNumbers.length; index++) {
          const num = this.phoneNumbers[index];
          
          const simulationData: any = { 
            ...simulationDataBase, 
            requestId: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}` };
          const storeData: any = { ...storeSimulation };

          simulationData.systemID = this.systemId;
          simulationData.password = this.password;
          simulationData.phoneNumber = num.trim();
          simulationData.message = this.mensaje;
          simulationData.number = this.cantidad;
          simulationData.shortCode = Number(this.sc);
          simulationData.encoding = this.encoding;

          storeData.system_id = this.systemId;
          storeData.password = this.password;
          storeData.phone_number = num.trim();
          storeData.message = this.mensaje;
          storeData.number = this.cantidad;
          storeData.short_code = Number(this.sc);
          storeData.encoding = this.encoding;

          console.log(`🚀 Enviando simulación ${index + 1}/${this.phoneNumbers.length} con número: ${num}`);

          try {
            // Enviar simulación
            const res = await lastValueFrom(this.apiService.sendSimulation(simulationData));
            console.log(`✅ Simulación ${index + 1} enviada con éxito:`, res);

            // Guardar registro en base de datos
            const r = await lastValueFrom(this.apiService.storeSimulation(storeData));
            console.log('📦 Simulación almacenada:', r);

            const id_simulation = r?.id_simulation;
            console.log('🆕 ID de simulación generado:', id_simulation);

            if (!id_simulation) {
              console.error('❌ No se pudo obtener el ID de la simulación');
              failedSimulations++;
              continue;
            }

            // Obtener usuario actual
            const currentUser = this.authService.getUser();
            if (!currentUser) {
              this.authService.logout();
              failedSimulations++;
              continue;
            }

            // Obtener usuarios y crear log
            try {
              const users = await lastValueFrom(this.apiService.getUsers());
              const matchedUser = users.find((u: any) => u.name === currentUser.name);
              
              if (matchedUser) {
                const id_user = matchedUser.id;
                const logData = {
                  id_user: id_user,
                  id_simulation: id_simulation,
                  id_server: null,
                  id_connection: null,
                  id_db: null,
                  description: `El usuario ejecutó una simulación:
                    Host = ${simulationDataBase.hostServer}, 
                    Puerto = ${simulationDataBase.portConnection},
                    Nombre Cola = ${simulationDataBase.nameQueue},
                    Número de Teléfono = ${storeData.phone_number},
                    Código Corto = ${storeData.short_code}`
                };

                console.log('🟢 Log listo para enviar:', logData);
                await lastValueFrom(this.apiService.storeLogs(logData));
                console.log('✅ Log guardado correctamente');
              }
            } catch (logError) {
              console.error('❌ Error al guardar log:', logError);
            }

            successfulSimulations++;

          } catch (error) {
            console.error(`❌ Error enviando simulación ${index + 1}:`, error);
            failedSimulations++;
          }

          // Pequeña pausa entre requests para evitar sobrecarga
          if (index < this.phoneNumbers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        // Mostrar resultado final
        if (failedSimulations === 0) {
          this.showAlert('success', `✅ Todas las ${successfulSimulations} simulaciones se completaron exitosamente.`);
        } else {
          this.showAlert('error', `⚠️ Completadas: ${successfulSimulations}, Fallidas: ${failedSimulations}`);
        }

        this.resetForm();

      // 🔹 SIMULACIÓN DE REUSO
      } else if (this.showReusoFields) {
        const simulationData: any = { ...simulationDataBase };
        const storeData: any = { ...storeSimulation };

        simulationData.systemID = this.systemId;
        simulationData.password = this.password;
        simulationData.phoneNumber = this.numeroTelefono;
        simulationData.message = this.mensaje;
        simulationData.number = this.cantidadReuso;
        simulationData.shortCode = Number(this.sc);
        simulationData.encoding = this.encoding;

        storeData.system_id = this.systemId;
        storeData.password = this.password;
        storeData.phone_number = this.numeroTelefono;
        storeData.message = this.mensaje;
        storeData.number = this.cantidadReuso;
        storeData.short_code = Number(this.sc);
        storeData.encoding = this.encoding;
        storeData.id_db = dbId;

        console.log('🚀 Enviando simulación de reuso');

        try {
          const res = await lastValueFrom(this.apiService.sendSimulation(simulationData));
          console.log('✅ Simulación de reuso enviada con éxito:', res);

          const r = await lastValueFrom(this.apiService.storeSimulation(storeData));
          console.log('📦 Simulación almacenada:', r);

          const id_simulation = r?.id_simulation;
          console.log('🆕 ID de simulación generado:', id_simulation);

          if (!id_simulation) {
            throw new Error('No se pudo obtener el ID de la simulación');
          }

          // Obtener usuario actual y crear log
          const currentUser = this.authService.getUser();
          if (currentUser) {
            const users = await lastValueFrom(this.apiService.getUsers());
            const matchedUser = users.find((u: any) => u.name === currentUser.name);
            
            if (matchedUser) {
              const id_user = matchedUser.id;
              const logData = {
                id_user: id_user,
                id_simulation: id_simulation,
                id_server: null,
                id_connection: null,
                id_db: null,
                description: `El usuario ejecutó una simulación de reuso:
                  Host = ${simulationDataBase.hostServer}, 
                  Puerto = ${simulationDataBase.portConnection},
                  Nombre Cola = ${simulationDataBase.nameQueue},
                  Número de Teléfono = ${storeData.phone_number},
                  Código Corto = ${storeData.short_code}`
              };

              await lastValueFrom(this.apiService.storeLogs(logData));
              console.log('✅ Log guardado correctamente');
            }
          }

          this.showAlert('success', '✅ Simulación de reuso enviada con éxito.');
          this.resetForm();

        } catch (error) {
          console.error('❌ Error en simulación de reuso:', error);
          this.showAlert('error', 'Error enviando simulación de reuso ❌');
        }
      }

    } catch (error) {
      console.error('❌ Error general en el proceso:', error);
      this.showAlert('error', 'Error en el proceso de simulación');
    } finally {
      this.isSubmitting = false;
    }
  }
}