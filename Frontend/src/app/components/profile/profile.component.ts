import { Component, OnInit, NgZone, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  simulations: any[] = [];
  filteredSimulations: any[] = [];
  userSimulations: any[] = []; // Nueva propiedad para almacenar solo las simulaciones del usuario
  connections: any[] = [];
  servers: any[] = [];
  db: any[] = [];
  selectedSimulation: any = null;
  users: any = null;
  phoneNumbers: string[] = [];

  isSubmitting = false;

  filtroServidor: string = '';
  filtroFecha: string = '';
  fechaEspecifica: string = '';

  googleUserData = {
    fullName: '',
    email: '',
    picture: '',
    accessLevel: '',
  };

  sendingLogs: string[] = [];
  showSendingDialog = false;

  @ViewChild('sendingLogContainer') sendingLogContainer!: ElementRef;

  alertVisible = false;
  alertType: 'success' | 'error' | null = null;
  alertMessage = '';

  lastSimulationDate: string | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

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

  // Getter para mostrar contador simple (puedes personalizar)
  get sendingLogsCountText(): string {
    // ejemplo: "3 logs"
    return `${this.sendingLogs.length} mensajes`;
  }

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.user = user;
      this.googleUserData = {
        fullName: user.name || '',
        email: user.email || '',
        picture: user.avatar || '',
        accessLevel: 'Usuario',
      };
    } else {
      this.authService.logout();
      return;
    }

    this.loadData();
  }

  loadData() {
    // Primero cargar los logs para obtener la relación id_user - id_simulation
    this.apiService.getLogs().subscribe({
      next: (logsRes: any) => {
        const logs = Array.isArray(logsRes) ? logsRes : logsRes.data ?? [];

        // Filtrar logs del usuario actual que tengan id_simulation
        const userLogs = logs.filter(
          (log: any) => log.id_user === this.user?.id && log.id_simulation
        );

        // Extraer los IDs de simulaciones del usuario
        const userSimulationIds = [...new Set(userLogs.map((log: any) => log.id_simulation))];

        console.log('📋 IDs de simulaciones del usuario:', userSimulationIds);

        // Encontrar la fecha más reciente de los logs del usuario
        if (userLogs.length > 0) {
          const latestLog = userLogs.reduce((a: any, b: any) =>
            new Date(a.created_at) > new Date(b.created_at) ? a : b
          );

          const fecha = new Date(latestLog.created_at);
          this.lastSimulationDate = fecha.toLocaleString('es-VE', {
            dateStyle: 'long',
            timeStyle: 'short',
          });
        } else {
          this.lastSimulationDate = null;
        }

        // Ahora cargar las simulaciones y filtrarlas
        this.apiService.getSimulation().subscribe({
          next: (simRes: any) => {
            this.simulations = Array.isArray(simRes) ? simRes : simRes.data ?? [];

            // Filtrar simulaciones que pertenecen al usuario según los logs
            this.userSimulations = this.simulations.filter(
              sim => userSimulationIds.includes(sim.id_simulation)
            );

            console.log(`✅ Simulaciones del usuario: ${this.userSimulations.length} de ${this.simulations.length} totales`);

            // Guardar simulaciones filtradas - USAR userSimulations
            this.filteredSimulations = [...this.userSimulations];
          },
          error: err => console.error('❌ Error cargando simulaciones:', err),
        });
      },
      error: (err) => console.error('❌ Error cargando logs:', err),
    });

    this.apiService.getConnection().subscribe({
      next: (res: any) => (this.connections = Array.isArray(res) ? res : res.data ?? []),
      error: err => console.error('❌ Error cargando conexiones:', err),
    });

    this.apiService.getServers().subscribe({
      next: (res: any) => (this.servers = Array.isArray(res) ? res : res.data ?? []),
      error: err => console.error('❌ Error cargando servidores:', err),
    });

    this.apiService.getDatabases().subscribe({
      next: (res: any) => (this.db = Array.isArray(res) ? res : res.data ?? []),
      error: err => console.error('❌ Error cargando bases de datos:', err),
    });
  }


  // 🧩 Métodos auxiliares
  getConnectionType(sim: any): string {
    const selectedConnection = this.connections.find(c => c.id_connection === sim.id_connection);
    return selectedConnection?.type || 'Desconocido';
  }

  getServerHost(sim: any): string {
    const selectedConnection = this.connections.find(c => c.id_connection === sim.id_connection);
    const selectedServer = this.servers.find(s => s.id_server === selectedConnection?.id_server);
    return selectedServer?.url || 'Desconocido';
  }

  getDB(sim: any): string {
    const selectedDB = this.db.find(d => d.id === sim.id_db);
    return selectedDB?.name || 'Desconocido';
  }

  getDate(sim: any): string {
    return sim.created_at ? new Date(sim.created_at).toLocaleString() : 'Desconocido';
  }

  selectSimulation(sim: any) {
    this.selectedSimulation = sim;
    // Al seleccionar una simulación, actualizar phoneNumbers si aplica
    this.processPhoneNumbers();
  }

  simIsSelected(sim: any): boolean {
    return this.selectedSimulation === sim;
  }

  // 🧮 Filtros
  applyFilters() {
    console.log('🔍 Aplicando filtros...');
    console.log('Filtro Servidor:', this.filtroServidor);
    console.log('Filtro Fecha:', this.filtroFecha);
    console.log('Fecha Específica:', this.fechaEspecifica);
    
    // SIEMPRE filtrar desde userSimulations, no desde simulations
    this.filteredSimulations = this.userSimulations.filter(sim => {
      const serverHost = this.getServerHost(sim);
      const simDate = new Date(sim.created_at || sim.date || '');
      const today = new Date();

      const matchServidor = this.filtroServidor ? serverHost.includes(this.filtroServidor) : true;

      let matchFecha = true;
      if (this.filtroFecha === 'hoy') {
        matchFecha = simDate.toDateString() === today.toDateString();
      } else if (this.filtroFecha === 'semana') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        matchFecha = simDate >= weekAgo && simDate <= today;
      } else if (this.filtroFecha === 'mes') {
        matchFecha = simDate.getMonth() === today.getMonth() && simDate.getFullYear() === today.getFullYear();
      } else if (this.filtroFecha === 'año') {
        matchFecha = simDate.getFullYear() === today.getFullYear();
      } else if (this.filtroFecha === 'personalizada' && this.fechaEspecifica) {
        // Parsear la fecha del input correctamente (viene en formato YYYY-MM-DD)
        const [year, month, day] = this.fechaEspecifica.split('-').map(Number);
        
        // Crear fecha personalizada sin problemas de zona horaria
        const customDateNormalized = new Date(year, month - 1, day);
        
        // Normalizar la fecha de la simulación
        const simDateNormalized = new Date(simDate.getFullYear(), simDate.getMonth(), simDate.getDate());
        
        // Comparar timestamps
        matchFecha = simDateNormalized.getTime() === customDateNormalized.getTime();
        
        // Debug
        console.log('📅 Comparando fechas:');
        console.log('  - Fecha personalizada:', customDateNormalized.toLocaleDateString());
        console.log('  - Fecha simulación:', simDateNormalized.toLocaleDateString());
        console.log('  - ¿Coinciden?:', matchFecha);
      }

      return matchServidor && matchFecha;
    });
    
    console.log(`✅ Resultados filtrados: ${this.filteredSimulations.length} de ${this.userSimulations.length}`);
  }

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

  getRandomDocuments(array: any[], count: number): any[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, array.length));
  }

  /**
   * processPhoneNumbers:
   * - Maneja phone_number que puede venir como string con comas o como array.
   * - Actualiza this.phoneNumbers como array de strings.
   */
  processPhoneNumbers() {
    this.phoneNumbers = [];

    if (!this.selectedSimulation) {
      return;
    }

    const pn = this.selectedSimulation.phone_number;

    if (!pn) {
      this.phoneNumbers = [];
      return;
    }

    if (Array.isArray(pn)) {
      // Asegurar que todos sean strings y sin espacios
      this.phoneNumbers = pn.map((n: any) => String(n).trim()).filter((n: string) => n !== '');
    } else if (typeof pn === 'string') {
      const raw = pn.trim();
      if (raw === '') {
        this.phoneNumbers = [];
      } else {
        this.phoneNumbers = raw.split(',').map(s => s.trim()).filter(s => s !== '');
      }
    } else {
      // Si viene en otro formato, intentar convertir a string
      const str = String(pn);
      this.phoneNumbers = str.split(',').map(s => s.trim()).filter(s => s !== '');
    }

    console.log('📞 Números de teléfono procesados:', this.phoneNumbers);
  }

  private logSimulationAction(action: string, id: string): void {
    const currentUser = this.authService.getUser();
    if (!currentUser) {
      console.warn('⚠️ No hay usuario autenticado para registrar log');
      return;
    }

    const logData = {
      id_user: currentUser.id,
      id_server: null,
      id_connection: null,
      id_db: null,
      id_simulation: id || null,
      description: action.replace('{user}', currentUser.name || 'Desconocido'),
    };

    this.apiService.storeLogs(logData).subscribe({
      next: () => console.log('✅ Log guardado correctamente'),
      error: (err) => console.error('❌ Error al guardar log:', err),
    });
  }

  // 📨 Enviar simulación seleccionada
  async onSubmit(event: Event) {
    event.preventDefault();

    if (this.isSubmitting) {
      this.showAlert('error', 'Ya hay un envío en proceso. Por favor espera.');
      return;
    }

    if (!this.selectedSimulation) {
      this.showAlert('error', 'No hay ninguna simulación seleccionada.');
      return;
    }

    this.isSubmitting = true;
    this.sendingLogs = [];          
    this.showSendingDialog = true;
    this.addLog(`🔔 Proceso iniciado: ${new Date().toLocaleString()}`);

    try {
      // Procesar números de teléfono (si aplica)
      this.processPhoneNumbers();

      console.log('💾 Datos del perfil:', this.googleUserData);

      const currentUser = this.authService.getUser();
      let matchedUser: any = null;

      if (currentUser && currentUser.name) {
        try {
          const users = await lastValueFrom(this.apiService.getUsers());
          const usersArray = Array.isArray(users) ? users : (users && Array.isArray(users.data) ? users.data : []);
          matchedUser = usersArray.find((u: any) => u && u.name === currentUser.name) ?? null;
        } catch (err) {
          console.error('❌ Error obteniendo usuarios para emparejar:', err);
          // matchedUser quedará en null y no bloquearemos el flujo
        }
      } else {
        console.log('⚠️ No hay usuario autenticado. Cerrando sesión.');
        this.authService.logout();
        this.isSubmitting = false;
        return;
      }

      // Mover estas lecturas aquí (ya que this.selectedSimulation existe)
      const selectedConnection = this.connections.find(connection => connection.id_connection === this.selectedSimulation.id_connection);
      const selectedServer = this.servers.find(server => server.id_server === selectedConnection?.id_server);
      const serverUrl = selectedServer?.url;
      const connectionPort = selectedConnection?.port;
      const connectionType = selectedConnection?.type;

      console.log('📦 Simulación seleccionada para enviar:', this.selectedSimulation);

      const simulationDataBase: any = {
        hostServer: serverUrl || 'Desconocido',
        portConnection: connectionPort ?? 'Desconocido',
        typeConnection: connectionType || 'Desconocido',
        nameQueue: this.selectedSimulation.nameQueue || this.selectedSimulation.name_queue || 'Desconocido',
      };

      // Si la simulación NO usa id_db -> tratar como "nuevo" (lista de phone_numbers explícita)
      if (!this.selectedSimulation.id_db) {
        // Validaciones
        if (!this.phoneNumbers || this.phoneNumbers.length === 0) {
          this.showAlert('error', 'La simulación no tiene números de teléfono válidos.');
          this.isSubmitting = false;
          return;
        }

        const allSimulations: any[] = [];

        for (let index = 0; index < this.phoneNumbers.length; index++) {
          const num = this.phoneNumbers[index];
          const simulationData: any = {
            ...simulationDataBase,
            requestId: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            systemID: this.selectedSimulation.system_id || this.selectedSimulation.systemId || '',
            password: this.selectedSimulation.password || '',
            phoneNumber: String(num).trim(),
            message: this.selectedSimulation.message || this.selectedSimulation.msg || '',
            number: Number(this.selectedSimulation.number) || 1,
            shortCode: Number(this.selectedSimulation.short_code ?? this.selectedSimulation.shortCode ?? 0),
            encoding: this.selectedSimulation.encoding ?? '0',
            // id_user: matchedUser ? matchedUser.id : null,
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
          const res = await lastValueFrom(this.apiService.sendSimulation(batchPayload));
          this.addLog(`✅ Envío exitoso: ${allSimulations.length} simulaciones procesadas.`);
          const successMessage = (res && (res.message || res.msg)) ? (res.message || res.msg) : `Se enviaron ${allSimulations.length} simulaciones.`;
          // this.showAlert('success', `✅ ${successMessage}`);
          console.log('✅ Respuesta del backend:', res);

          // Registrar log (usar id_simulation si está disponible)
          const id_simulation = this.selectedSimulation.id_simulation ?? null;
          
          this.logSimulationAction(`El usuario {user} ha enviado ${allSimulations.length} simulaciones nuevas.`, id_simulation);
          await this.closeDialogAndShowAlert('success', `✅ Se enviaron ${allSimulations.length} simulaciones.`);
        } catch (error) {
          console.error('❌ Error enviando simulaciones (nuevo):', error);
          this.addLog(`❌ Error: ${error}`);
          await this.closeDialogAndShowAlert('error', 'Error enviando simulaciones.');
          // this.showAlert('error', '❌ Error enviando simulaciones.');
        }

      } else {
        // Reuso: tomar documentos desde la colección y mapear
        let allDocuments: any[] = [];
        try {
          const res = await lastValueFrom(this.apiService.getCollectionData(this.selectedSimulation.id_db, this.selectedSimulation.collection));
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

        const count = Number(this.selectedSimulation.number) || 1;
        const selectedDocs = this.getRandomDocuments(allDocuments, count);

        const allSimulations: any[] = selectedDocs.map((doc, i) => ({
          ...simulationDataBase,
          requestId: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          systemID: this.selectedSimulation.system_id || doc.SystemID || doc.systemId || '',
          password: this.selectedSimulation.password || doc.password || '',
          phoneNumber: doc.PhoneNumber || doc.submitSm?.destAddress || doc.phone_number || '',
          message: doc.Text || doc.submitSm?.shortMessageString || doc.message || '',
          number: count,
          shortCode: Number(doc.ShortCode || doc.shortCode || doc.sc || 0),
          encoding: doc.Encoding || doc.submitSm?.dataCoding || '0',
          sarSegmentSeqNum: doc.SAR_SEGMENT_SEQNUM || 0,
          sarMsgRefNum: doc.SAR_MSG_REF_NUM || 0,
          sarTotalSegments: doc.SAR_TOTAL_SEGMENTS || 0,
          // id_user: matchedUser ? matchedUser.id : null,
        }));

        const batchPayload = {
          simulations: allSimulations,
          total: allSimulations.length,
          timestamp: new Date().toISOString(),
          type: 'reuso',
        };

        this.addLog(`🚀 Enviando ${allSimulations.length} simulaciones...`);

        try {
          const res = await lastValueFrom(this.apiService.sendSimulation(batchPayload));
          this.addLog(`✅ Envío exitoso: ${allSimulations.length} simulaciones procesadas.`);
          const successMessage = (res && (res.message || res.msg)) ? (res.message || res.msg) : `Se enviaron ${allSimulations.length} simulaciones.`;
          // this.showAlert('success', `✅ ${successMessage}`);
          console.log('✅ Respuesta del backend:', res);

          // Registrar log (usar id_simulation si está disponible)
          const id_simulation = this.selectedSimulation.id_simulation ?? null;
          
          this.logSimulationAction(`El usuario {user} ha reutilizado ${allSimulations.length} simulaciones.`, id_simulation);
          await this.closeDialogAndShowAlert('success', `✅ Se enviaron ${allSimulations.length} simulaciones.`);
        } catch (err) {
          console.error('❌ Error enviando simulaciones (reuso):', err);
          this.addLog(`❌ Error: ${err}`);
          await this.closeDialogAndShowAlert('error', 'Error enviando simulaciones.');
          
        }
      }

    } catch (outerErr) {
      console.error('❌ Error general en onSubmit:', outerErr);
      this.showAlert('error', 'Error en el proceso de envío.');
    } finally {
      // Resetar estado de envío
      this.isSubmitting = false;
    }
  }

  getAccessLevelClass(level: string) {
    const base = 'px-2 py-1 text-xs font-medium rounded-full';
    if (level === 'Administrador') return `${base} bg-red-100 text-red-700`;
    if (level === 'Avanzado') return `${base} bg-yellow-100 text-yellow-700`;
    return `${base} bg-green-100 text-green-700`;
  }
}