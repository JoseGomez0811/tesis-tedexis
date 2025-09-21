import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()  // 👈 Esto habilita HttpClient en toda la app
  ]
})
.catch(err => console.error(err));
