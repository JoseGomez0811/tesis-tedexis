import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api/v1';
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  // --- SERVERS ---
  getServers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/servers`);
  }

  addServer(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/servers`, data);
  }

  // --- SIMULATIONS ---
  sendSimulation(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/simulations/send`, data);
  }

  // --- DATABASES ---
  getDatabases(): Observable<any> {
    return this.http.get(`${this.baseUrl}/databases`); // ✅ Cambiado
  }

  addDatabase(data: any): Observable<any> {
    console.log('🚀 Enviando a:', `${this.baseUrl}/databases`);
    console.log('🚀 Datos:', data);
    return this.http.post(`${this.baseUrl}/databases`, data, this.httpOptions); // ✅ Con headers
  }

  updateDatabase(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/databases/${id}`, data, this.httpOptions); // ✅ Con headers
  }

  deleteDatabase(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/databases/${id}`, this.httpOptions); // ✅ Con headers
  }
}