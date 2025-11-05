import { Component, OnInit, ChangeDetectorRef, NgZone, ViewChild, ElementRef } from '@angular/core';
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
  sarSegmentSeqNum = '';
  sarMsgRefNum = '';
  sarTotalSegments = '';

  // Campos reuso
  baseDeDatos = '';
  cantidadReuso: number | null = null;

  showNuevoFields = false;
  showReusoFields = false;

  alertVisible = false;
  alertType: 'success' | 'error' | null = null;
  alertMessage = '';
  isSubmitting = false; // Nueva variable para controlar estado de envío

  @ViewChild('sendingLogContainer') sendingLogContainer!: ElementRef;

  sendingLogs: string[] = [];
  showSendingDialog = false;


  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
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

  // Añade un log y fuerza detección dentro de Angular zone
  addLog(message: string) {
    // Ejecutar dentro de NgZone para asegurar actualización de UI cuando usamos await/async
    this.ngZone.run(() => {
      this.sendingLogs.push(message);
      // limitar historial (opcional)
      if (this.sendingLogs.length > 200) {
        this.sendingLogs.shift();
      }
      // Forzar detección y scrollear
      this.cd.detectChanges();
      this.scrollLogsToBottom();
    });
  }

  scrollLogsToBottom() {
    try {
      if (this.sendingLogContainer && this.sendingLogContainer.nativeElement) {
        const el = this.sendingLogContainer.nativeElement as HTMLElement;
        // Dejar un pequeño timeout para asegurar que el nuevo node está renderizado
        setTimeout(() => {
          el.scrollTop = el.scrollHeight;
        }, 50);
      }
    } catch (e) {
      // no bloquear si falla
      console.warn('scroll error', e);
    }
  }

  trackByLogIndex(index: number): number {
    return index;
  }

  closeSendingDialog() {
    this.showSendingDialog = false;
    this.sendingLogs = [];
  }

  // Getter para mostrar contador simple (puedes personalizar)
  get sendingLogsCountText(): string {
    // ejemplo: "3 logs"
    return `${this.sendingLogs.length} mensajes`;
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
        this.collection = Array.isArray(res) ? res : (res.collections ?? []);
        //this.collection = Array.isArray(res) ? res : res.data ?? [];
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
        //this.documents = Array.isArray(res) ? res : res.data ?? [];
        this.documents = Array.isArray(res) ? res : (res.data ?? []);
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
        const doc = res && res.document ? res.document : res;
        this.selectedDocument = doc;
        console.log('✅ Documento detallado cargado:', doc);
        this.systemId = doc.SystemID || doc.systemId || '';
        this.numeroTelefono = doc.submitSm.destAddress || doc.phoneNumber || '';
        this.mensaje = doc.submitSm.shortMessageString || doc.Text || '';
        this.sc = doc.shortCode || doc.ShortCode || '';
        this.encoding = doc.Encoding || doc.submitSm.dataCoding || '';
        this.sarSegmentSeqNum = doc.SAR_SEGMENT_SEQNUM || '';
        this.sarMsgRefNum = doc.SAR_MSG_REF_NUM || '';
        this.sarTotalSegments = doc.SAR_TOTAL_SEGMENTS || '';

        console.table({
          systemId: this.systemId,
          numeroTelefono: this.numeroTelefono,
          mensaje: this.mensaje,
          sc: this.sc,
          encoding: this.encoding,
          sarSegmentSeqNum: this.sarSegmentSeqNum,
          sarMsgRefNum: this.sarMsgRefNum,
          sarTotalSegments: this.sarTotalSegments,
      });
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

  getRandomDocuments(array: any[], count: number): any[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }


  async onSubmit(event: Event) {
    event.preventDefault();

    if (this.isSubmitting) {
      this.showAlert('error', 'Ya hay una simulación en proceso. Por favor espera.');
      return;
    }

    // al iniciar envío:
    this.isSubmitting = true;
    //this.showAlert('success', 'Enviando simulaciones...'); // si quieres mantener el toast inicial
    this.sendingLogs = [];            // limpiar logs previos
    this.showSendingDialog = true;    // mostrar el dialog de logs
    this.addLog(`🔔 Proceso iniciado: ${new Date().toLocaleString()}`);
    //this.showAlert('success', 'Iniciando envío de simulaciones...');

    // Procesar los números ingresados antes de enviar
    this.processPhoneNumbers();

    const selectedServer = this.servers.find(server => server.name === this.selectedServer);
    const serverUrl = selectedServer?.url;
    const serverID = selectedServer?.id_server;
    //const selectedConnection = this.connections.find(connection => connection.name === this.selectedConnection);
    const selectedConnection = this.filteredConnections.find(connection => connection.name === this.selectedConnection);
    const connectionPort = selectedConnection?.port;
    const connectionType = selectedConnection?.type;
    const connectionID = selectedConnection?.id_connection;
    const selectedDatabase = this.db.find(database => database.name === this.selectedDB);
    const dbId = selectedDatabase?.id;

    // Obtener usuario actual y proteger el acceso a su propiedad `name`.
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
      return;
    }

    const simulationDataBase: any = {
      hostServer: serverUrl,
      portConnection: connectionPort,
      typeConnection: connectionType,
      nameQueue: this.nombreCola,
      id_connection: connectionID,
      // id_db: dbId,
    };

    try {
      // 🔹 SIMULACIÓN NUEVA
      if (this.showNuevoFields) {
        if (this.phoneNumbers.length === 0) {
          this.showAlert('error', 'Por favor, ingrese al menos un número de teléfono válido.');
          this.isSubmitting = false;
          return;
        }

        const allSimulations: any[] = [];

        // Crear todas las simulaciones primero (sin enviarlas aún)
        for (let index = 0; index < this.phoneNumbers.length; index++) {
          const num = this.phoneNumbers[index];
          const simulationData: any = {
            ...simulationDataBase,
            requestId: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            systemID: this.systemId,
            password: this.password,
            phoneNumber: num.trim(),
            message: this.mensaje,
            number: this.cantidad,
            shortCode: Number(this.sc),
            encoding: this.encoding,
            // id_user: matchedUser ? matchedUser.id : null,
            // description: `Simulación múltiple (${index + 1}) enviada en un solo lote.`,
          };

          allSimulations.push(simulationData);
        }

        // 🔸 Crear payload unificado
        const batchPayload = {
          simulations: allSimulations,
          total: allSimulations.length,
          timestamp: new Date().toISOString(),
        };

        this.addLog(`🚀 Enviando ${allSimulations.length} simulaciones en un solo POST...`);

        try {
          const res = await lastValueFrom(this.apiService.sendSimulation(batchPayload));
          this.addLog(`✅ Envío exitoso: ${allSimulations.length} simulaciones procesadas.`);
          this.showAlert('success', `✅ Se enviaron ${allSimulations.length} simulaciones en un único POST.`);
        } catch (error) {
          console.error('❌ Error enviando simulaciones agrupadas:', error);
          this.showAlert('error', 'Error enviando simulaciones agrupadas.');
        }

        this.resetForm();


      // 🔹 SIMULACIÓN DE REUSO
      } else if (this.showReusoFields) {
        if (!this.selectedDB || !this.selectedCollection) {
          this.showAlert('error', 'Debe seleccionar una base de datos y una colección.');
          this.isSubmitting = false;
          return;
        }

        if (!this.cantidadReuso || this.cantidadReuso <= 0) {
          this.showAlert('error', 'Debe indicar una cantidad válida de registros a reutilizar.');
          this.isSubmitting = false;
          return;
        }

        // Cargar todos los documentos de la colección seleccionada
        const dbObj = this.db.find(d => d.name === this.selectedDB);
        const collectionName = this.selectedCollection;

        if (!dbObj || !dbObj.id) {
          this.showAlert('error', 'No se encontró la base de datos seleccionada.');
          this.isSubmitting = false;
          return;
        }

        let allDocuments: any[] = [];
        try {
          const res = await lastValueFrom(this.apiService.getCollectionData(dbObj.id, collectionName));
          allDocuments = Array.isArray(res) ? res : (res.data ?? []);
        } catch (err) {
          console.error('❌ Error obteniendo los documentos:', err);
          this.showAlert('error', 'Error al cargar los registros de la colección.');
          this.isSubmitting = false;
          return;
        }

        if (allDocuments.length === 0) {
          this.showAlert('error', 'La colección seleccionada está vacía.');
          this.isSubmitting = false;
          return;
        }

        // 🔸 Seleccionar registros aleatorios sin repetición
        const selectedDocs = this.getRandomDocuments(allDocuments, this.cantidadReuso);

        // 🔹 Crear todas las simulaciones dentro de un solo array JSON
        const allSimulations: any[] = selectedDocs.map((doc, i) => ({
          ...simulationDataBase,
          requestId: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          systemID: doc.SystemID || doc.systemId || '',
          password: this.password || doc.password || '',
          phoneNumber: doc.PhoneNumber || doc.submitSm?.destAddress || '',
          message: doc.Text || doc.submitSm?.shortMessageString || '',
          number: this.cantidadReuso,
          shortCode: Number(doc.ShortCode || doc.shortCode || doc.sc || 0),
          encoding: doc.Encoding || doc.submitSm?.dataCoding || '0',
          sarSegmentSeqNum: doc.SAR_SEGMENT_SEQNUM || 0,
          sarMsgRefNum: doc.SAR_MSG_REF_NUM || 0,
          sarTotalSegments: doc.SAR_TOTAL_SEGMENTS || 0,
          // id_user: matchedUser ? matchedUser.id : null,
          // description: `Simulación reuso - ${this.cantidadReuso} registros`,
        }));

        // 🔸 Crear payload unificado
        const batchPayload = {
          simulations: allSimulations,
          total: allSimulations.length,
          timestamp: new Date().toISOString(),
        };

        this.addLog(`🚀 Enviando ${allSimulations.length} simulaciones en un solo POST...`);

        try {
          const res = await lastValueFrom(this.apiService.sendSimulation(batchPayload));
          this.addLog(`✅ Envío exitoso: ${allSimulations.length} simulaciones procesadas.`);
          this.showAlert('success', `✅ Se enviaron ${allSimulations.length} simulaciones en un único POST.`);
        } catch (error) {
          console.error('❌ Error enviando simulaciones agrupadas:', error);
          this.showAlert('error', 'Error enviando simulaciones agrupadas.');
        }

        this.resetForm();
      }



    } catch (error) {
      console.error('❌ Error general en el proceso:', error);
      this.showAlert('error', 'Error en el proceso de simulación');
    } finally {
      this.isSubmitting = false;
      // auto ocultar dialog después de 2s
      setTimeout(() => {
        this.showSendingDialog = false;
        this.sendingLogs = [];
      }, 2000);
    }

  }
}