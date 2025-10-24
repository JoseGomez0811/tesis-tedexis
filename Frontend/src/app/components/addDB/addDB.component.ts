import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-addDB',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './addDB.component.html',
  styleUrls: ['./addDB.component.css']
})
export class AddDBComponent {
  name = '';
  host = '';
  port: number = 0;
  user = '';
  password = '';
  auth_db = '';
  name_db = '';
  users: any = null;
  db: any = null;

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
    setTimeout(() => (this.alertVisible = false), 4000);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    console.log('🎯 onSubmit ejecutado!');

    // ✅ Validar campos obligatorios
    if (!this.name || !this.host || !this.port || !this.user || !this.password || !this.name_db) {
      this.showAlert('error', 'Por favor completa todos los campos');
      return;
    }

    const newDB = {
      name: this.name,
      host: this.host,
      port: Number(this.port),
      user: this.user,
      password: this.password,
      auth_db: this.auth_db,
      name_db: this.name_db,
    };

    console.log('📤 Enviando nueva base de datos:', newDB);

    // ✅ 1️⃣ Guardar base de datos
    this.apiService.addDatabase(newDB).subscribe({
      next: (res: any) => {
        console.log('✅ Respuesta de addDatabase:', res);

        this.showAlert('success', 'Base de datos registrada con éxito ✅');

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
              
              this.apiService.getDatabases().subscribe({
                next: (db: any[]) => {
                  // Busca el usuario cuyo nombre coincida con el usuario actual
                  const matchedDB = db.find(
                    (d) => d.name === newDB.name
                  );

                  if (matchedDB) {
                    const id_db = matchedDB.id; // ✅ Guardamos el id del usuario
                    // Creamos el log con el id encontrado
                    const logData = {
                      id_user: id_user,
                      id_server: null,
                      id_connection: null,
                      id_db: id_db || null,
                      id_simulation: null,
                      description: `Se agregó una nueva base de datos: 
                        Nombre = ${newDB.name}, 
                        Host = ${newDB.host}, 
                        Puerto = ${newDB.port}`,
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


        // ✅ 3️⃣ Limpiar formulario
        this.resetForm();
      },
      error: (err) => {
        console.error('❌ Error al registrar base de datos:', err);
        if (err.status === 422) {
          this.showAlert('error', 'Error de validación. Revisa los datos ingresados.');
        } else {
          this.showAlert('error', `Error al registrar: ${err.message || 'Error desconocido'}`);
        }
      }
    });
  }

  private resetForm() {
    this.name = '';
    this.host = '';
    this.port = 0;
    this.user = '';
    this.password = '';
    this.auth_db = '';
    this.name_db = '';
  }
}
