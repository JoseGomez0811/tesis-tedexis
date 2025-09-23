import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { MainLayoutComponent } from './main-layout.component';
import { TestingComponent } from './components/testing/testing.component';
import { AddServerComponent } from './components/addServer/addServer.component';
import { AddDBComponent } from './components/addDB/addDB.component';
import { AuthSuccessComponent } from './components/auth-success/auth-success.component';
import { PermissionComponent } from './components/permission/permission.component';

export const routes: Routes = [
  // Redirigir la raíz al login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  
  // Ruta de login - fuera del MainLayout
  {
    path: 'login',
    component: LoginComponent
  },
 
  // Rutas dentro del MainLayout (protegidas)
  {
    path: 'app',
    component: MainLayoutComponent,
    children: [
      {
        path: 'perfil',
        component: ProfileComponent
      },
      {
        path: 'simulacion',
        component: TestingComponent
      },
      {
        path: 'nuevo_servidor',
        component: AddServerComponent
      },
      {
        path: 'nueva_base_de_datos',
        component: AddDBComponent
      },
      {
        path: 'permisos',
        component: PermissionComponent
      },
      {
        path: '',
        redirectTo: 'perfil',
        pathMatch: 'full'
      }
    ]
  },
 
  // Ruta de captura para URLs no válidas
  {
    path: '**',
    redirectTo: 'login'
  }
];