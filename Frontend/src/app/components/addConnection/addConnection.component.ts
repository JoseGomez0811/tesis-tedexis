import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgForOf } from '@angular/common';

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

  users: any = null;
  connection: any = null;

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

  onSubmit(event: Event) {
    event.preventDefault();
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
        this.showAlert('success', 'Conexión añadida con éxito ✅');
        console.log(res);
        this.selectedServer = '';
        this.nombre = '';
        this.puerto = '';
        this.conexion = '';

        const currentUser = this.authService.getUser();

        if (currentUser) {
          this.users = currentUser;
          this.googleUserData = {
            fullName: currentUser.name || '',
            email: currentUser.email || '',
          };
        } else {
          this.authService.logout();
          return; // Detiene la ejecución si no hay usuario
        }

        // 🔹 Obtenemos la lista de usuarios desde la API
        this.apiService.getUsers().subscribe({
          next: (users: any[]) => {
            // Busca el usuario cuyo nombre coincida con el usuario actual
            const matchedUser = users.find(
              (u) => u.name === this.googleUserData.fullName
            );

            if (matchedUser) {
              const id_user = matchedUser.id;
              
              this.apiService.getConnection().subscribe({
                next: (connection: any[]) => {
                  // Busca el usuario cuyo nombre coincida con el usuario actual
                  const matchedConnection = connection.find(
                    (c) => c.name === newConnection.name
                  );

                  if (matchedConnection) {
                    const id_connection = matchedConnection.id_connection; // ✅ Guardamos el id del usuario
                    // Creamos el log con el id encontrado
                    const logData = {
                      id_user: id_user,
                      id_server: null,
                      id_connection: id_connection || null,
                      id_db:  null,
                      id_simulation: null,
                      description: `Se agregó una nueva conexión: 
                        Nombre = ${newConnection.name},
                        Tipo = ${newConnection.type},
                        Puerto = ${newConnection.port}`, 
                    };


                    console.log('🟢 Log listo para enviar:', logData);

                    // ✅ Enviar los logs al backend
                    this.apiService.storeLogs(logData).subscribe({
                      next: (res) => console.log('✅ Log guardado correctamente:', res),
                      error: (err) => console.error('❌ Error al guardar log:', err),
                    });
                  
                  } else {
                    console.warn('⚠️ No se encontró el id de la base de datos');
                  }
                },
                error: (err) => {
                  console.error('❌ Error al obtener el id de la base de datos:', err);
                },
              });

              
            } else {
              console.warn('⚠️ No se encontró el usuario en la base de datos');
            }
          },
          error: (err) => {
            console.error('❌ Error al obtener usuarios:', err);
          },
        });
      },
      error: err => {
        this.showAlert('error', 'Error al añadir conexión ❌');
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