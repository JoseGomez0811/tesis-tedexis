import { Component, OnInit, ChangeDetectorRef, NgZone, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SidenavService } from '../../services/sidenav.service';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule, NgForOf, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-testing',
  standalone: true,
  imports: [CommonModule, FormsModule, NgForOf],
  templateUrl: './testing.component.html',
  styleUrls: ['./testing.component.css']
})
export class TestingComponent implements OnInit, OnDestroy {
  servers: any[] = [];
  db: any[] = [];
  collections: any[] = [];
  documents: any[] = [];
  connections: any[] = [];
  filteredConnections: any[] = [];
  selectedDocument: any = null;
  phoneNumbers: any[] = [];
  collectionNames: string[] = [];
  mensajeMaxLength: number | null = null;

  users: any = null;

  googleUserData = {
    fullName: '',
    email: '',
  };

  // <-- ahora permiten null para distinguir "sin valor" de ""
  selectedServer: string | null = null;
  selectedConnection: string | null = null;
  selectedDB: string | null = null;
  selectedCollection: string | null = null;
  tipoConexion: string | null = null;
  tipoSimulacion: string | null = null;
  showQueueField = false;
  nombreCola: string | null = null;
  dbPassword: string | null = null;
  dbSystemID: string | null = null;
  documentsCount: number | null = null;
  
  // Estados de carga
  loadingCollections = false;
  loadingDocuments = false;

  // Campos nuevo (permitir null)
  numeroTelefono: string | null = null;
  mensaje: string | null = null;
  cantidad: number | null = null;
  systemId: string | null = null;
  password: string | null = null;
  sc: string | null = null;
  encoding: string | null = null;
  sarSegmentSeqNum: string | null = null;
  sarMsgRefNum: string | null = null;
  sarTotalSegments: string | null = null;

  // Campos reuso
  baseDeDatos: string | null = null;
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

  isSideNavCollapsed = false;
  private sidenavSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private sidenavService: SidenavService,
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
    if (!this.isSubmitting) {
      this.showSendingDialog = false;
      this.sendingLogs = [];
    }
  }

  // Método mejorado para cerrar el dialog y mostrar alerta
  async closeDialogAndShowAlert(type: 'success' | 'error', message: string) {
    return new Promise<void>((resolve) => {
      // Esperar 2 segundos para que el usuario vea el último mensaje
      setTimeout(() => {
        // Cerrar el dialog
        this.showSendingDialog = false;
        
        // Esperar a que la animación de cierre termine (400ms)
        setTimeout(() => {
          // Limpiar logs
          this.sendingLogs = [];
          
          // Mostrar la alerta
          this.showAlert(type, message);
          
          resolve();
        }, 400);
      }, 2000); // 2 segundos de espera para ver el mensaje final
    });
  }

  /**
   * Consulta periódicamente al backend para saber si el Web Service
   * terminó de enviar los datos a los servidores.
   */
  private async waitForSimulationStatus(requestId: string): Promise<{ ok: boolean; message: string }> {
    const maxAttempts = 30;       // ~60 segundos (30 * 2s)
    const delayMs = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const res: any = await lastValueFrom(this.apiService.checkSimulationStatus(requestId));

        if (res && res.exists && res.data) {
          const data = res.data;

          // Si ya llegó la respuesta final del Web Service (stage 2)
          if (data.stage === 2 || data.status === 'completed' || data.status === 'failed') {
            const isSuccess = data.status === 'completed';
            const baseMessage = data.message || (isSuccess
              ? 'Los datos se enviaron correctamente a los servidores.'
              : 'Hubo un problema enviando los datos a los servidores.');

            this.addLog(isSuccess
              ? `✅ Simulación completada en el Web Service: ${baseMessage}`
              : `❌ El Web Service reportó un error: ${baseMessage}`
            );

            if (!isSuccess && Array.isArray(data.error_details) && data.error_details.length > 0) {
              this.addLog(`❌ Detalles: ${data.error_details.join(' | ')}`);
            }

            return { ok: isSuccess, message: baseMessage };
          }
        }
      } catch (err) {
        console.error('❌ Error consultando estado de simulación:', err);
      }

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    const timeoutMessage = 'No se recibió respuesta final del Web Service dentro del tiempo esperado.';
    this.addLog(`❌ ${timeoutMessage}`);
    return { ok: false, message: timeoutMessage };
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
    this.selectedConnection = null;
    this.showQueueField = false;
    this.tipoSimulacion = null;
    this.showNuevoFields = false;
    this.showReusoFields = false;
  }

  filterConnections() {
    const id_server = this.servers.find(server => server.name === this.selectedServer)?.id_server;
    this.filteredConnections = this.connections.filter(conn => conn.id_server === id_server);
  }

  toggleFields(event: any) {
    // Manejar correctamente valores null, string "null", o string vacío
    const rawValue = event?.target?.value;
    const value = rawValue === 'null' || rawValue === '' || rawValue === null || rawValue === undefined 
      ? null 
      : rawValue;
    
    this.tipoSimulacion = value;
    this.showNuevoFields = value === 'nuevo';
    this.showReusoFields = value === 'reuso';
  }

  onConnectionChange() {
    const selected = this.filteredConnections.find(conn => conn.name === this.selectedConnection);
    this.showQueueField = selected && selected.type && selected.type.toLowerCase() === 'mq';
    if (!this.showQueueField) this.nombreCola = null;

    this.tipoSimulacion = null;
    this.showNuevoFields = false;
    this.showReusoFields = false;
  }

  onDatabaseChange() {
    const db = this.db.find(d => d.name === this.selectedDB);
    if (!db || !db.id) {
      this.collections = [];
      this.loadingCollections = false;
      this.selectedCollection = null;
      this.documentsCount = null;
      return;
    }

    this.loadingCollections = true;
    this.selectedCollection = null;
    this.documentsCount = null;

    this.apiService.getCollections(db.id).subscribe({
      next: (res: any) => {
        this.collections = Array.isArray(res) ? res : (res.collections ?? []);
        this.loadingCollections = false;
        //this.collection = Array.isArray(res) ? res : res.data ?? [];
      },
      error: err => {
        console.error('Error cargando colecciones:', err);
        this.collections = [];
        this.loadingCollections = false;
        this.showAlert('error', 'Error al cargar las colecciones. Por favor, verifica la conexión a la base de datos.');
      }
    });
  }

  onCollectionChange() {

    const collectionName = this.selectedCollection;


    const dbObj = this.db.find(d => d.name === this.selectedDB);

    if (!dbObj || !dbObj.id || !collectionName) {
      this.documents = [];
      this.loadingDocuments = false;
      this.documentsCount = null;
      return;
    }

    this.loadingDocuments = true;
    this.documentsCount = null;

    this.apiService.getCollectionData(dbObj.id, collectionName).subscribe({
      next: (res: any) => {
        //this.documents = Array.isArray(res) ? res : res.data ?? [];
        this.documents = Array.isArray(res) ? res : (res.data ?? []);
        this.selectedDocument = null;
        // Usar totalCount si está disponible, sino usar el conteo de documentos devueltos como fallback
        this.documentsCount = res.totalCount !== undefined ? res.totalCount : (this.documents.length || 0);
        this.loadingDocuments = false;
      },
      error: err => {
        console.error('Error cargando documentos:', err);
        this.documents = [];
        this.selectedDocument = null;
        this.documentsCount = null;
        this.loadingDocuments = false;
        this.showAlert('error', 'Error al cargar los documentos. Por favor, verifica la conexión a la base de datos.');
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
        this.systemId = doc.SystemID || doc.systemId || null;
        this.numeroTelefono = doc.submitSm?.destAddress || doc.phoneNumber || null;
        this.mensaje = doc.submitSm?.shortMessageString || doc.Text || null;
        this.sc = doc.shortCode || doc.ShortCode || null;
        this.encoding = doc.Encoding || doc.submitSm?.dataCoding || null;
        this.sarSegmentSeqNum = doc.SAR_SEGMENT_SEQNUM || null;
        this.sarMsgRefNum = doc.SAR_MSG_REF_NUM || null;
        this.sarTotalSegments = doc.SAR_TOTAL_SEGMENTS || null;

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

  // resetForm que limpia NgForm y variables del componente
  resetForm(formulario?: NgForm) {
    if (formulario) {
      formulario.resetForm();
    }

    // RESETEA TODAS LAS VARIABLES DEL FORMULARIO a null (estado "sin valor")
    this.selectedServer = null;
    this.selectedConnection = null;
    this.selectedDB = null;
    this.selectedCollection = null;
    this.collections = [];
    this.documents = [];
    this.tipoConexion = null;
    this.tipoSimulacion = null;
    this.showQueueField = false;
    this.nombreCola = null;
    this.dbPassword = null;
    this.dbSystemID = null;
    this.numeroTelefono = null;
    this.phoneNumbers = [];
    this.mensaje = null;
    this.cantidad = null;
    this.systemId = null;
    this.password = null;
    this.sc = null;
    this.encoding = null;
    this.baseDeDatos = null;
    this.cantidadReuso = null;
    this.documentsCount = null;
    this.showNuevoFields = false;
    this.showReusoFields = false;
    this.mensajeMaxLength = null;
    this.loadingCollections = false;
    this.loadingDocuments = false;
    // NOTA: isSubmitting se controla desde onSubmit / finally, NO lo reseteamos aquí por seguridad
  }

  getRandomDocuments(array: any[], count: number): any[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }

  private logSimulationAction(action: string, id: string): void {
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
        id_simulation: id || null,
        description: action.replace('{user}', currentUser.name || 'Desconocido'),
    };

    // Enviar log de forma asíncrona sin bloquear la UI
    this.apiService.storeLogs(logData).subscribe({
        next: () => console.log('✅ Log guardado correctamente'),
        error: (err) => console.error('❌ Error al guardar log:', err),
    });
  }

  onEncodingChange() {
    const encodingValue = Number(this.encoding);

    if (encodingValue === 0) {
      this.mensajeMaxLength = null; // sin límite
    } else if (encodingValue === 3) {
      this.mensajeMaxLength = 160;
    } else if (encodingValue === 8) {
      this.mensajeMaxLength = 170;
    } else {
      this.mensajeMaxLength = null;
    }
  }

  async onSubmit(event: Event, formulario: NgForm) {
    event.preventDefault();
    console.log('🔵 onSubmit iniciado - isSubmitting:', this.isSubmitting);

    if (this.isSubmitting) {
      console.log('⚠️ Ya hay una simulación en proceso');
      this.showAlert('error', 'Ya hay una simulación en proceso. Por favor espera.');
      return;
    }
    
    this.isSubmitting = true;
    console.log('✅ isSubmitting establecido en true');

    try {
      // --- Validaciones base ---
      const queueNameFromForm = typeof formulario?.value?.nombreCola === 'string'
        ? formulario.value.nombreCola
        : (this.nombreCola ?? '');
      const normalizedQueueName = queueNameFromForm ? queueNameFromForm.trim() : '';

      if (!this.selectedServer) {
        this.showAlert('error', 'Debes seleccionar un servidor.');
        this.isSubmitting = false;
        return;
      }

      if (!this.selectedConnection) {
        this.showAlert('error', 'Debes seleccionar un tipo de conexión.');
        this.isSubmitting = false;
        return;
      }

      if (this.showQueueField && normalizedQueueName.length === 0) {
        this.showAlert('error', 'Debes ingresar el nombre de la cola.');
        this.isSubmitting = false;
        return;
      }

      // Validar formato del nombre de la cola: solo letras, números y underscore, sin espacios
      if (this.showQueueField && normalizedQueueName.length > 0) {
        const queueNameRegex = /^[a-zA-Z0-9_]+$/;
        if (!queueNameRegex.test(normalizedQueueName)) {
          this.showAlert('error', 'El nombre de la cola solo puede contener letras, números y guion bajo (_). No se permiten espacios ni otros caracteres especiales.');
          this.isSubmitting = false;
          return;
        }
      }
      this.nombreCola = this.showQueueField ? normalizedQueueName : null;

      if (!this.tipoSimulacion) {
        this.showAlert('error', 'Debes seleccionar el tipo de simulación.');
        this.isSubmitting = false;
        return;
      }

      // --- Validaciones según tipo ---
      if (this.tipoSimulacion === 'nuevo') {
        const requiresPassword = this.selectedConnectionType === 'smpp';

        // System ID
        if (!this.systemId || this.systemId.trim().length < 3 || !/^[A-Za-z0-9_-]+$/.test(this.systemId)) {
          this.showAlert('error', 'Ingresa un System ID válido (mínimo 3 caracteres, sin espacios).');
          this.isSubmitting = false;
          return;
        }

        // Contraseña
        if (requiresPassword && (!this.password || this.password.trim().length < 4)) {
          this.showAlert('error', 'La contraseña debe tener al menos 4 caracteres.');
          this.isSubmitting = false;
          return;
        }

        // Número de teléfono - validar múltiples números separados por coma
        if (!this.numeroTelefono || this.numeroTelefono.trim() === '') {
          this.showAlert('error', 'Ingresa al menos un número de teléfono válido.');
          this.isSubmitting = false;
          return;
        }

        // Procesar números separados por coma y validar cada uno
        const phoneNumbers = this.numeroTelefono
          .split(',')
          .map(num => num.trim())
          .filter(num => num !== '');

        if (phoneNumbers.length === 0) {
          this.showAlert('error', 'Ingresa al menos un número de teléfono válido.');
          this.isSubmitting = false;
          return;
        }

        const phoneRegex = /^[0-9]{10,15}$/;
        const invalidNumbers = phoneNumbers.filter(num => !phoneRegex.test(num));
        
        if (invalidNumbers.length > 0) {
          this.showAlert('error', `Los siguientes números no son válidos: ${invalidNumbers.join(', ')}. Deben tener entre 10 y 15 dígitos.`);
          this.isSubmitting = false;
          return;
        }

        if (!this.mensaje || this.mensaje.trim().length === 0) {
          this.showAlert('error', 'El mensaje es obligatorio.');
          this.isSubmitting = false;
          return;
        }

        const encodingValue = Number(this.encoding);

        if (encodingValue === 3 && (this.mensaje?.length ?? 0) > 160) {
          this.showAlert('error', 'El mensaje no puede superar los 160 caracteres con encoding 3.');
          this.isSubmitting = false;
          return;
        }

        if (encodingValue === 8 && (this.mensaje?.length ?? 0) > 170) {
          this.showAlert('error', 'El mensaje no puede superar los 170 caracteres con encoding 8.');
          this.isSubmitting = false;
          return;
        }

        // Cantidad
        if (!this.cantidad || this.cantidad <= 0) {
          this.showAlert('error', 'La cantidad debe ser mayor a 0.');
          this.isSubmitting = false;
          return;
        }

        // Short Code
        if (!this.sc || !/^[0-9]{4,6}$/.test(this.sc)) {
          this.showAlert('error', 'Ingresa un Short Code válido (4–6 dígitos).');
          this.isSubmitting = false;
          return;
        }

        if (!this.encoding) {
          this.showAlert('error', 'Debes seleccionar un encoding.');
          this.isSubmitting = false;
          return;
        }
      }

      if (this.tipoSimulacion === 'reuso') {
        // Base de datos
        if (!this.selectedDB) {
          this.showAlert('error', 'Debes seleccionar una base de datos.');
          this.isSubmitting = false;
          return;
        }

        // Colección
        if (!this.selectedCollection) {
          this.showAlert('error', 'Debes seleccionar una colección.');
          this.isSubmitting = false;
          return;
        }

        // Cantidad
        if (!this.cantidadReuso || this.cantidadReuso <= 0) {
          this.showAlert('error', 'La cantidad de reuso debe ser mayor a 0.');
          this.isSubmitting = false;
          return;
        }
      }

      // ✅ Si pasa todas las validaciones
      console.log('✅ Todas las validaciones pasaron, iniciando envío...');
      
      // al iniciar envío:
      this.sendingLogs = [];            // limpiar logs previos
      this.showSendingDialog = true;    // mostrar el dialog de logs
      this.addLog(`🔔 Proceso iniciado: ${new Date().toLocaleString()}`);

      // Procesar los números ingresados antes de enviar
      this.processPhoneNumbers();

      const selectedServer = this.servers.find(server => server.name === this.selectedServer);
      const serverUrl = selectedServer?.url;
      const serverID = selectedServer?.id_server;
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
          const usersArray = Array.isArray(users) ? users : (users && Array.isArray(users.data) ? users.data : []);
          matchedUser = usersArray.find((u: any) => u && u.name === currentUser.name) ?? null;
        } catch (err) {
          console.error('❌ Error obteniendo usuarios para emparejar:', err);
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
      };

      const storeDataBase: any = {
        id_connection: connectionID,
        nameQueue: this.nombreCola || null,
        id_db: dbId || null,
      };

      // 🔹 SIMULACIÓN NUEVA
      if (this.showNuevoFields) {
        if (this.phoneNumbers.length === 0) {
          this.showAlert('error', 'Por favor, ingrese al menos un número de teléfono válido.');
          this.isSubmitting = false;
          return;
        }

        const storeData: any = {
          ...storeDataBase,
          system_id: this.systemId,
          password: this.password,
          phone_number: String(this.phoneNumbers),
          message: this.mensaje,
          number: this.cantidad,
          short_code: Number(this.sc),
          encoding: this.encoding,
        };

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
          };

          allSimulations.push(simulationData);
        }

        const batchPayload = {
          simulations: allSimulations,
          total: allSimulations.length,
          timestamp: new Date().toISOString(),
          type: 'nuevo',
        };

        this.addLog(`🚀 Enviando ${allSimulations.length} simulaciones...`);

        try {
          const res: any = await lastValueFrom(this.apiService.sendSimulation(batchPayload));

          // ✅ Respuesta inmediata del Web Service (stage 1)
          const wsResponse = res?.webservice;
          const initialMessage = wsResponse?.message || 'Datos recibidos por el Web Service.';

          this.addLog(`✅ Web Service recibió los datos: ${initialMessage}`);
          this.addLog('🔎 Verificando estado de la simulación...');

          const requestId: string | undefined = res?.requestId;
          let finalStatus = { ok: true, message: 'Simulación enviada correctamente.' };

          // Si tenemos un ID de correlación, esperar la respuesta final (stage 2)
          if (requestId) {
            finalStatus = await this.waitForSimulationStatus(requestId);
          }

          // Guardar la simulación como antes
          const store = await lastValueFrom(this.apiService.storeSimulation(storeData));
          this.logSimulationAction(`El usuario {user} ha enviado ${allSimulations.length} simulaciones nuevas.`, store.id_simulation);

          if (finalStatus.ok) {
            await this.closeDialogAndShowAlert('success', `✅ ${finalStatus.message}`);
          } else {
            await this.closeDialogAndShowAlert('error', `❌ ${finalStatus.message}`);
          }
        } catch (error) {
          console.error('❌ Error enviando simulaciones:', error);
          this.addLog(`❌ Error: ${error}`);
          await this.closeDialogAndShowAlert('error', 'Error enviando simulaciones.');
          this.isSubmitting = false; // Resetear en caso de error
        }

        // <-- PASAR formulario para resetear estados
        this.resetForm(formulario);
        this.isSubmitting = false; // Asegurar que se resetee después del resetForm

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

        // Cargar documentos aleatorios de la colección seleccionada usando $sample de MongoDB
        const dbObj = this.db.find(d => d.name === this.selectedDB);
        const collectionName = this.selectedCollection;

        if (!dbObj || !dbObj.id) {
          this.showAlert('error', 'No se encontró la base de datos seleccionada.');
          this.isSubmitting = false;
          return;
        }

        let allDocuments: any[] = [];
        try {
          // Usar el parámetro sample para obtener documentos aleatorios directamente desde MongoDB
          const res = await lastValueFrom(this.apiService.getCollectionData(dbObj.id, collectionName, false, this.cantidadReuso));
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

        this.collectionNames.length = 0;
        if (collectionName) {
          this.collectionNames.push(collectionName);
        }
        console.log('📁 Colección actual:', this.collectionNames[0]);

        // Los documentos ya vienen aleatorios desde MongoDB usando $sample
        const selectedDocs = allDocuments;

        // 🔹 Extraer systemID representativo del primer documento si no está definido
        const firstDoc = selectedDocs[0] || null;
        const representativeSystemID = this.systemId || firstDoc?.SystemID || firstDoc?.systemId || '';

        const storeData: any = {
          ...storeDataBase,
          system_id: representativeSystemID,
          password: this.password || firstDoc?.password || '',
          phone_number: 'N/A',
          message: 'N/A',
          number: this.cantidadReuso,
          short_code:  0,
          encoding: 0,
          collection: collectionName,
        };

        // 🔹 Crear todas las simulaciones dentro de un solo array JSON
        const allSimulations: any[] = selectedDocs.map((doc, i) => ({
          ...simulationDataBase,
          requestId: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          systemID: this.systemId || doc.SystemID || doc.systemId || '',
          password: this.password || doc.password || '',
          phoneNumber: doc.PhoneNumber || doc.submitSm?.destAddress || '',
          message: doc.Text || doc.submitSm?.shortMessageString || '',
          number: this.cantidadReuso,
          shortCode: Number(doc.ShortCode || doc.shortCode || doc.sc || 0),
          encoding: doc.Encoding || doc.submitSm?.dataCoding || '0',
          sarSegmentSeqNum: doc.SAR_SEGMENT_SEQNUM || 0,
          sarMsgRefNum: doc.SAR_MSG_REF_NUM || 0,
          sarTotalSegments: doc.SAR_TOTAL_SEGMENTS || 0,
        }));

        const batchPayload = {
          simulations: allSimulations,
          total: allSimulations.length,
          timestamp: new Date().toISOString(),
          type: 'reuso',
        };

        this.addLog(`🚀 Enviando ${allSimulations.length} simulaciones...`);

        try {
          const res: any = await lastValueFrom(this.apiService.sendSimulation(batchPayload));

          // ✅ Respuesta inmediata del Web Service (stage 1)
          const wsResponse = res?.webservice;
          const initialMessage = wsResponse?.message || 'Datos recibidos por el Web Service.';

          this.addLog(`✅ Web Service recibió los datos: ${initialMessage}`);
          this.addLog('🔎 Verificando estado de la simulación...');

          const requestId: string | undefined = res?.requestId;
          let finalStatus = { ok: true, message: 'Simulación enviada correctamente.' };

          // Si tenemos un ID de correlación, esperar la respuesta final (stage 2)
          if (requestId) {
            finalStatus = await this.waitForSimulationStatus(requestId);
          }

          // Guardar la simulación como antes
          const store = await lastValueFrom(this.apiService.storeSimulation(storeData));
          this.logSimulationAction(`El usuario {user} ha reutilizado ${allSimulations.length} simulaciones.` , store.id_simulation);

          if (finalStatus.ok) {
            await this.closeDialogAndShowAlert('success', `✅ ${finalStatus.message}`);
          } else {
            await this.closeDialogAndShowAlert('error', `❌ ${finalStatus.message}`);
          }
        } catch (error) {
          console.error('❌ Error enviando simulaciones:', error);
          this.addLog(`❌ Error: ${error}`);
          await this.closeDialogAndShowAlert('error', 'Error enviando simulaciones.');
          this.isSubmitting = false; // Resetear en caso de error
        }

        // <-- PASAR formulario para resetear estados
        this.resetForm(formulario);
        this.isSubmitting = false; // Asegurar que se resetee después del resetForm
      }
    } catch (error) {
      console.error('❌ Error general en el proceso:', error);
      this.showAlert('error', 'Error en el proceso de simulación');
      this.isSubmitting = false; // Resetear en caso de error general
    } finally {
      console.log('🔵 Bloque finally ejecutado - reseteando isSubmitting');
      this.isSubmitting = false;
      // auto ocultar dialog después de 2s
      setTimeout(() => {
        this.showSendingDialog = false;
        this.sendingLogs = [];
      }, 2000);
    }
  }
}
