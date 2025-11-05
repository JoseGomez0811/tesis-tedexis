import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthCallbackComponent } from './components/auth/auth-callback/auth-callback.component';

// ... otras importaciones ...

const routes: Routes = [
  // ... otras rutas ...
  { path: 'auth-callback', component: AuthCallbackComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }