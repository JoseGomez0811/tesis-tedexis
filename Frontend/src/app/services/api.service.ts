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

  // --- CONNECTIONS ---
  getConnection(): Observable<any> {
    return this.http.get(`${this.baseUrl}/connections`);
  }

  addConnection(data: any): Observable<any> {
    console.log('🚀 Datos:', data);
    return this.http.post(`${this.baseUrl}/connections`, data);
  }

// --- COLLECTIONS ---
getCollections(dbId: string): Observable<any> {
  return this.http.get(`${this.baseUrl}/mongo/${dbId}/collections`);
}

getCollectionData(dbId: string, collection: string): Observable<any> {
  return this.http.get(`${this.baseUrl}/mongo/${dbId}/collections/${collection}`);
}

getDocument(dbId: string, collection: string, docId: string): Observable<any> {
  return this.http.get(`${this.baseUrl}/mongo/${dbId}/collections/${collection}/${docId}`);
}
// --- SIMULATIONS ---

  getSimulation(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get_simulation`);
  }

  storeSimulation(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/store_data`, data);
  }

  sendSimulation(data: any): Observable<any> {
    console.log('🚀 Datos:', data);
    return this.http.post(`${this.baseUrl}/send_data`, data);
  }
  
  // --- LOGS ---

  getLogs(): Observable<any> {
    return this.http.get(`${this.baseUrl}/logs`);
  }

  storeLogs(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/store_logs`, data);
  }

  // --- USERS ---

  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`);
  }

}