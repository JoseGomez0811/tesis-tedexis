import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // private baseUrl = 'http://localhost:8000/api/v1';
  // private baseUrl = 'https://localhost/api/v1';
  private baseUrl = environment.apiUrl;

  // private httpOptions = {
  //   headers: new HttpHeaders({
  //     'Content-Type': 'application/json',
  //     'Accept': 'application/json'
  //   })
  // };

  private httpOptionsWithCredentials = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }),
  withCredentials: true
};


  constructor(private http: HttpClient) {}

  // --- SERVERS ---
  getServers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/servers`);
  }

  addServer(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/servers`, data);
  }

  updateServer(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/servers/${id}`, data, this.httpOptionsWithCredentials); // ✅ Con headers
  }

  // deleteServer(id: number): Observable<any> {
  //   return this.http.delete(`${this.baseUrl}/servers/${id}`, this.httpOptions); // ✅ Con headers
  // }

  deleteServer(id: number, id_user: number) {
    return this.http.delete(`${this.baseUrl}/servers/${id}`, {
      body: { id_user }, // 👈 enviamos el id_user en el cuerpo del DELETE
      headers: this.httpOptionsWithCredentials.headers
    });
  }


  // --- DATABASES ---
  getDatabases(): Observable<any> {
    return this.http.get(`${this.baseUrl}/databases`); // ✅ Cambiado
  }

  addDatabase(data: any): Observable<any> {
    console.log('🚀 Enviando a:', `${this.baseUrl}/databases`);
    console.log('🚀 Datos:', data);
    return this.http.post(`${this.baseUrl}/databases`, data, this.httpOptionsWithCredentials); // ✅ Con headers
  }

  updateDatabase(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/databases/${id}`, data, this.httpOptionsWithCredentials); // ✅ Con headers
  }

  // deleteDatabase(id: number): Observable<any> {
  //   return this.http.delete(`${this.baseUrl}/databases/${id}`, this.httpOptions); // ✅ Con headers
  // }

  deleteDatabase(id: number, id_user: number) {
    return this.http.delete(`${this.baseUrl}/databases/${id}`, {
      body: { id_user }, // 👈 enviamos el id_user en el cuerpo del DELETE
      headers: this.httpOptionsWithCredentials.headers
    });
  }

  // --- CONNECTIONS ---
  getConnection(): Observable<any> {
    return this.http.get(`${this.baseUrl}/connections`);
  }

  addConnection(data: any): Observable<any> {
    console.log('🚀 Datos:', data);
    return this.http.post(`${this.baseUrl}/connections`, data);
  }

  updateConnection(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/connections/${id}`, data, this.httpOptionsWithCredentials); // ✅ Con headers
  }

  deleteConnection(id: number, id_user: number) {
    return this.http.delete(`${this.baseUrl}/connections/${id}`, {
      body: { id_user }, // 👈 enviamos el id_user en el cuerpo del DELETE
      headers: this.httpOptionsWithCredentials.headers
    });
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