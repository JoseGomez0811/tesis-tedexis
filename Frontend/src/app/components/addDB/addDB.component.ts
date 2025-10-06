import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-addDB',
  imports: [FormsModule, CommonModule],
  templateUrl: './addDB.component.html',
  styleUrls: ['./addDB.component.css']
})
export class AddDBComponent {

  name = '';
  host = '';
  port: number = 0; // ✅ Cambiar a number
  user = '';
  password = '';
  auth_db = '';
  name_db = '';
  //collection = '';

  constructor(private apiService: ApiService) {
    console.log('🔧 ApiService inyectado:', !!this.apiService);
  }

  onSubmit(event: Event) {
    console.log('🎯 onSubmit ejecutado!'); // ✅ Primer debug
    event.preventDefault();
    
    // ✅ Validación básica antes de enviar
    // if (!this.name || !this.host || !this.port || !this.user || !this.password || 
    //     !this.auth_db || !this.name_db || !this.collection) {
    //   console.error('❌ Todos los campos son requeridos');
    //   alert('Por favor completa todos los campos');
    //   return;
    // }

    if (!this.name || !this.host || !this.port || !this.user || !this.password || !this.name_db) {
      console.error('❌ Todos los campos son requeridos');
      alert('Por favor completa todos los campos');
      return;
    }

    const newDB = {
      name: this.name,
      host: this.host,
      port: Number(this.port), // ✅ Asegurar que sea número
      user: this.user,
      password: this.password,
      auth_db: this.auth_db,
      name_db: this.name_db,
      // collection: this.collection
    };

    console.log('📤 Datos a enviar:', newDB);
    console.log('🔍 Iniciando petición HTTP...');
    
    this.apiService.addDatabase(newDB).subscribe({
      next: (res) => {
        console.log('✅ Respuesta API:', res);
        alert('Base de datos registrada con éxito ✅');
        this.resetForm();
      },
      error: (err) => {
        console.error('❌ Error completo:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Error body:', err.error);
        
        if (err.status === 422) {
          console.error('❌ Errores de validación:', err.error.errors);
          alert('Error de validación. Revisa los datos ingresados.');
        } else {
          alert(`Error al registrar: ${err.message || 'Error desconocido'}`);
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
    //this.collection = '';
  }
}