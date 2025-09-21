// // src/app/profile/profile.component.ts
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { AuthService } from '../../services/auth.service';

// @Component({
//   selector: 'app-profile',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './profile.component.html',
//   styleUrls: ['./profile.component.css']
// })
// export class ProfileComponent implements OnInit {
//   user: any = null; // Usuario autenticado

//   googleUserData = {
//     fullName: '',
//     email: '',
//     department: '',
//     jobTitle: '',
//     organization: '',
//     manager: '',
//     accessLevel: '',
//     lastLogin: ''
//   };

//   historial: any[] = [
//     { servidor: 'Servidor 1', conexion: 'SMPP', mensaje: 'Login exitoso', cantidad: 1, fecha: '2025-07-23' },
//     { servidor: 'Servidor 2', conexion: 'MQ', mensaje: 'Envío de mensaje', cantidad: 3, fecha: '2025-07-22' },
//   ];

//   filtroServidor: string = '';
//   filtroConexion: string = '';
//   filtroFecha: string = '';
//   fechaEspecifica: string = '';

//   constructor(private authService: AuthService) {}

//   ngOnInit(): void {
//     // Capturar token desde la URL (si viene)
//     const params = new URLSearchParams(window.location.search);
//     const token = params.get('token');
//     if (token) {
//       // Guardar token y un usuario temporal
//       this.authService.handleAuthSuccess(token, {
//         name: 'Usuario Tedexis',
//         email: 'usuario@tedexis.com'
//       });
//     }

//     // Cargar usuario desde localStorage
//     const user = this.authService.getUser();
//     if (user) {
//       this.user = user;
//       console.log('👤 Usuario cargado:', this.user);

//       // Llenar datos del perfil
//       this.googleUserData = {
//         fullName: this.user.name || '',
//         email: this.user.email || '',
//         department: 'Desarrollo',
//         jobTitle: 'Desarrollador',
//         organization: 'Tedexis',
//         manager: 'Por definir',
//         accessLevel: 'Usuario',
//         lastLogin: new Date().toLocaleDateString()
//       };

//       console.log('📋 Datos del perfil actualizados:', this.googleUserData);
//     } else {
//       console.warn('⚠️ No hay usuario autenticado, redirigiendo a login...');
//       this.authService.logout();
//     }
//   }

//   // Filtrado del historial
//   get historialFiltrado() {
//     return this.historial.filter((item) => {
//       const cumpleServidor = this.filtroServidor ? item.servidor === this.filtroServidor : true;
//       const cumpleConexion = this.filtroConexion ? item.conexion === this.filtroConexion : true;
//       const fechaItem = item.fecha;
//       let cumpleFecha = true;
//       const hoy = new Date().toISOString().split('T')[0];

//       if (this.filtroFecha === 'hoy') {
//         cumpleFecha = fechaItem === hoy;
//       } else if (this.filtroFecha === 'semana') {
//         const hoyDate = new Date();
//         const fechaInicioSemana = new Date(hoyDate);
//         fechaInicioSemana.setDate(hoyDate.getDate() - hoyDate.getDay());
//         cumpleFecha = new Date(fechaItem) >= fechaInicioSemana;
//       } else if (this.filtroFecha === 'mes') {
//         const fechaActual = new Date();
//         const fechaRegistro = new Date(fechaItem);
//         cumpleFecha =
//           fechaRegistro.getMonth() === fechaActual.getMonth() &&
//           fechaRegistro.getFullYear() === fechaActual.getFullYear();
//       } else if (this.filtroFecha === 'año') {
//         const añoActual = new Date().getFullYear();
//         cumpleFecha = new Date(fechaItem).getFullYear() === añoActual;
//       } else if (this.filtroFecha === 'personalizada' && this.fechaEspecifica) {
//         cumpleFecha = fechaItem === this.fechaEspecifica;
//       }

//       return cumpleServidor && cumpleConexion && cumpleFecha;
//     });
//   }

//   // Guardar cambios del perfil (simulación)
//   onSubmit(event: Event) {
//     event.preventDefault();
//     console.log('💾 Configuración guardada:', this.googleUserData);
//     // Aquí puedes agregar lógica para enviar los datos al servidor si quieres
//   }

//   // Clases CSS para nivel de acceso
//   getAccessLevelClass(level: string) {
//     const base = 'px-2 py-1 text-xs font-medium rounded-full';
//     if (level === 'Administrador') return `${base} bg-red-100 text-red-700`;
//     if (level === 'Avanzado') return `${base} bg-yellow-100 text-yellow-700`;
//     return `${base} bg-green-100 text-green-700`;
//   }
// }

// src/app/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null; // Usuario autenticado

  googleUserData = {
    fullName: '',
    email: '',
    department: '',
    jobTitle: '',
    organization: '',
    manager: '',
    accessLevel: '',
    lastLogin: ''
  };

  historial: any[] = [
    { servidor: 'Servidor 1', conexion: 'SMPP', mensaje: 'Login exitoso', cantidad: 1, fecha: '2025-07-23' },
    { servidor: 'Servidor 2', conexion: 'MQ', mensaje: 'Envío de mensaje', cantidad: 3, fecha: '2025-07-22' },
  ];

  filtroServidor: string = '';
  filtroConexion: string = '';
  filtroFecha: string = '';
  fechaEspecifica: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
  const params = new URLSearchParams(window.location.search);

  const token = params.get('token');
  const userParam = params.get('user'); // <-- ahora viene del backend

  if (token) {
    let userData: any = null;
    if (userParam) {
      try {
        userData = JSON.parse(userParam);
      } catch (e) {
        console.error('❌ Error al parsear user data:', e);
      }
    }

    // Guardar token y usuario real en AuthService / localStorage
    this.authService.handleAuthSuccess(token, userData);
  }

  // Obtener usuario desde AuthService
  const user = this.authService.getUser();
  if (user) {
    this.user = user;
    console.log('👤 Usuario cargado desde Google:', this.user);

    this.googleUserData = {
      fullName: this.user.name || '',
      email: this.user.email || '',
      department: this.user.department || '',
      jobTitle: this.user.jobTitle || '',
      organization: 'Tedexis',
      manager: this.user.manager || '',
      accessLevel: 'Usuario',
      lastLogin: new Date().toLocaleDateString()
    };
  } else {
    console.warn('⚠️ No hay usuario autenticado, redirigiendo a login...');
    this.authService.logout();
  }
}


  // Filtrado del historial
  get historialFiltrado() {
    return this.historial.filter((item) => {
      const cumpleServidor = this.filtroServidor ? item.servidor === this.filtroServidor : true;
      const cumpleConexion = this.filtroConexion ? item.conexion === this.filtroConexion : true;
      const fechaItem = item.fecha;
      let cumpleFecha = true;
      const hoy = new Date().toISOString().split('T')[0];

      if (this.filtroFecha === 'hoy') {
        cumpleFecha = fechaItem === hoy;
      } else if (this.filtroFecha === 'semana') {
        const hoyDate = new Date();
        const fechaInicioSemana = new Date(hoyDate);
        fechaInicioSemana.setDate(hoyDate.getDate() - hoyDate.getDay());
        cumpleFecha = new Date(fechaItem) >= fechaInicioSemana;
      } else if (this.filtroFecha === 'mes') {
        const fechaActual = new Date();
        const fechaRegistro = new Date(fechaItem);
        cumpleFecha =
          fechaRegistro.getMonth() === fechaActual.getMonth() &&
          fechaRegistro.getFullYear() === fechaActual.getFullYear();
      } else if (this.filtroFecha === 'año') {
        const añoActual = new Date().getFullYear();
        cumpleFecha = new Date(fechaItem).getFullYear() === añoActual;
      } else if (this.filtroFecha === 'personalizada' && this.fechaEspecifica) {
        cumpleFecha = fechaItem === this.fechaEspecifica;
      }

      return cumpleServidor && cumpleConexion && cumpleFecha;
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    console.log('💾 Configuración guardada:', this.googleUserData);
    // Aquí puedes agregar lógica para enviar los datos al servidor si quieres
  }

  getAccessLevelClass(level: string) {
    const base = 'px-2 py-1 text-xs font-medium rounded-full';
    if (level === 'Administrador') return `${base} bg-red-100 text-red-700`;
    if (level === 'Avanzado') return `${base} bg-yellow-100 text-yellow-700`;
    return `${base} bg-green-100 text-green-700`;
  }
}
