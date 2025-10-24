import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

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
  connections: any[] = [];
  servers: any[] = [];
  selectedSimulation: any = null;
  users: any = null;

  filtroServidor: string = '';
  filtroFecha: string = '';
  fechaEspecifica: string = '';

  googleUserData = {
    fullName: '',
    email: '',
    picture: '',
    accessLevel: '',
  };

  alertVisible = false;
  alertType: 'success' | 'error' | null = null;
  alertMessage = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

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
    this.apiService.getSimulation().subscribe({
      next: (res: any) => {
        this.simulations = Array.isArray(res) ? res : res.data ?? [];
        this.filteredSimulations = [...this.simulations];
      },
      error: err => console.error('❌ Error cargando simulaciones:', err),
    });

    this.apiService.getConnection().subscribe({
      next: (res: any) => (this.connections = Array.isArray(res) ? res : res.data ?? []),
      error: err => console.error('❌ Error cargando conexiones:', err),
    });

    this.apiService.getServers().subscribe({
      next: (res: any) => (this.servers = Array.isArray(res) ? res : res.data ?? []),
      error: err => console.error('❌ Error cargando servidores:', err),
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

  getDate(sim: any): string {
    return sim.created_at ? new Date(sim.created_at).toLocaleString() : 'Desconocido';
  }

  selectSimulation(sim: any) {
    this.selectedSimulation = sim;
  }

  simIsSelected(sim: any): boolean {
    return this.selectedSimulation === sim;
  }

  // 🧮 Filtros
  applyFilters() {
    this.filteredSimulations = this.simulations.filter(sim => {
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
        const customDate = new Date(this.fechaEspecifica);
        matchFecha = simDate.toDateString() === customDate.toDateString();
      }

      return matchServidor && matchFecha;
    });
  }

  // 📨 Enviar simulación
  /** ✅ Guardar datos del perfil o usar la simulación seleccionada */
  onSubmit(event: Event) {
    event.preventDefault();

    console.log('💾 Datos del perfil:', this.googleUserData);

    const selectedConnection = this.connections.find(connection => connection.id_connection === this.selectedSimulation.id_connection);
    const selectedServer = this.servers.find(server => server.id_server === selectedConnection.id_server);
    const serverUrl = selectedServer?.url;
    const connectionPort = selectedConnection?.port;
    const connectionType = selectedConnection?.type;

    // console.log('🔗 Detalles de la conexión seleccionada:', serverUrl);
    // console.log('🔢 Puerto de la conexión seleccionada:', connectionPort);
    // console.log('🔧 Tipo de la conexión seleccionada:', connectionType);

    if (this.selectedSimulation) {
      console.log('📦 Simulación seleccionada para enviar:', this.selectedSimulation);
      
      const simulationData: any = {
        hostServer: serverUrl || 'Desconocido',
        portConnection: connectionPort || 'Desconocido',
        typeConnection: connectionType || 'Desconocido',
        nameQueue: this.selectedSimulation.nameQueue || 'Desconocido',
        systemID: this.selectedSimulation.system_id || 'Desconocido',
        password: this.selectedSimulation.password || 'Desconocido',
        phoneNumber: this.selectedSimulation.phone_number || 'Desconocido',
        message: this.selectedSimulation.message || 'Desconocido',
        number: this.selectedSimulation.number || 'Desconocido',
        shortCode: this.selectedSimulation.short_code || 'Desconocido',
        encoding: this.selectedSimulation.encoding || 'Desconocido'
      }

      this.apiService.sendSimulation(simulationData).subscribe({
        next: (res) => {
          const successMessage = res.message || 'Respuesta exitosa del servidor.';
          this.showAlert('success','✅ Simulación enviada con éxito:');
          console.log('✅ Simulación enviada con éxito:', res);

          console.log('📥 Respuesta del backend:', res);

          // const id_simulation = res.data?.id_simulation;
          const id_simulation = this.selectedSimulation.id_simulation;
          console.log('🆔 ID de la simulación para logs:', id_simulation);

          const currentUser = this.authService.getUser();

          if (currentUser) {
            this.users = currentUser;
            this.googleUserData = {
              fullName: currentUser.name || '',
              email: currentUser.email || '',
              picture: currentUser.avatar || '',
              accessLevel: 'Usuario',
            };
          } else {
            this.authService.logout();
            return;
          }

          this.apiService.getUsers().subscribe({
            next: (users: any[]) => {
              const matchedUser = users.find(u => u.name === this.googleUserData.fullName);
              if (matchedUser) {
                const id_user = matchedUser.id;

                const logData = {
                  id_user: id_user,
                  id_simulation: id_simulation, // ✅ ya lo tienes
                  id_server: null,
                  id_connection: null,
                  id_db: null,
                  description: `El usuario ejecutó una simulación:
                    Host = ${simulationData.hostServer}, 
                    Puerto = ${simulationData.portConnection},
                    Nombre Cola = ${simulationData.nameQueue},
                    Número de Teléfono = ${simulationData.phoneNumber},
                    Short Code = ${simulationData.shortCode}`
                };

                console.log('🟢 Log listo para enviar:', logData);

                this.apiService.storeLogs(logData).subscribe({
                  next: (res) => console.log('✅ Log guardado correctamente:', res),
                  error: (err) => console.error('❌ Error al guardar log:', err),
                });
              } else {
                console.warn('⚠️ No se encontró el usuario en la base de datos');
              }
            },
            error: (err) => console.error('❌ Error al obtener usuarios:', err),
          });
        },
        error: (err) => {
          this.showAlert('error','❌ Error de red enviando simulación');
          console.error('❌ Error de red o del servidor:', err);
        }
      });

    } else {
      console.warn('⚠️ No hay simulación seleccionada');
    }
  }

  // 🎨 Alertas
  showAlert(type: 'success' | 'error', message: string) {
    this.alertType = type;
    this.alertMessage = message;
    this.alertVisible = true;
    setTimeout(() => (this.alertVisible = false), 4000);
  }

  getAccessLevelClass(level: string) {
    const base = 'px-2 py-1 text-xs font-medium rounded-full';
    if (level === 'Administrador') return `${base} bg-red-100 text-red-700`;
    if (level === 'Avanzado') return `${base} bg-yellow-100 text-yellow-700`;
    return `${base} bg-green-100 text-green-700`;
  }
}
