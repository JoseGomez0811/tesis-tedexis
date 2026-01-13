import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, finalize, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // private baseUrl = 'http://localhost:8000/api/v1';
  // private baseUrl = 'https://localhost/api/v1';
  private baseUrl = environment.apiUrl;
  private cache = new Map<string, { timestamp: number; data: any }>();
  private cacheTTL = 60 * 1000; // 60 segundos por defecto
  private inFlightRequests = new Map<string, Observable<any>>();

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

  private createRequestKey(method: string, url: string, payload?: any): string {
    const payloadKey = payload ? JSON.stringify(payload) : '';
    return `${method}:${url}:${payloadKey}`;
  }

  private runWithInflightControl<T>(key: string, factory: () => Observable<T>): Observable<T> {
    const existing = this.inFlightRequests.get(key);
    if (existing) {
      return existing;
    }

    const request$ = factory().pipe(
      finalize(() => this.inFlightRequests.delete(key)),
      shareReplay(1)
    );

    this.inFlightRequests.set(key, request$);
    return request$;
  }

  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheTTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { timestamp: Date.now(), data });
  }

  private invalidateCache(keys: string | string[]): void {
    const list = Array.isArray(keys) ? keys : [keys];
    list.forEach(key => this.cache.delete(key));
  }

  // --- SERVERS ---
  getServers(forceRefresh = false): Observable<any> {
    const cacheKey = 'servers';
    if (!forceRefresh) {
      const cached = this.getCache<any>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    return this.http.get(`${this.baseUrl}/servers`).pipe(
      tap(res => this.setCache(cacheKey, res))
    );
  }

  addServer(data: any): Observable<any> {
    const url = `${this.baseUrl}/servers`;
    const key = this.createRequestKey('POST', url, data);
    return this.runWithInflightControl(key, () =>
      this.http.post(url, data).pipe(
        tap(() => this.invalidateCache('servers'))
      )
    );
  }

  updateServer(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/servers/${id}`;
    const key = this.createRequestKey('PUT', url, data);
    return this.runWithInflightControl(key, () =>
      this.http.put(url, data, this.httpOptionsWithCredentials).pipe(
        tap(() => this.invalidateCache('servers'))
      )
    ); // ✅ Con headers
  }

  // deleteServer(id: number): Observable<any> {
  //   return this.http.delete(`${this.baseUrl}/servers/${id}`, this.httpOptions); // ✅ Con headers
  // }

  deleteServer(id: number, id_user: number) {
    const url = `${this.baseUrl}/servers/${id}`;
    const key = this.createRequestKey('DELETE', url, { id_user });
    return this.runWithInflightControl(key, () =>
      this.http.delete(url, {
        body: { id_user }, // 👈 enviamos el id_user en el cuerpo del DELETE
        headers: this.httpOptionsWithCredentials.headers
      }).pipe(
        tap(() => this.invalidateCache('servers'))
      )
    );
  }


  // --- DATABASES ---
  getDatabases(forceRefresh = false): Observable<any> {
    const cacheKey = 'databases';
    if (!forceRefresh) {
      const cached = this.getCache<any>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }
    return this.http.get(`${this.baseUrl}/databases`).pipe(
      tap(res => this.setCache(cacheKey, res))
    ); // ✅ Cambiado
  }

  addDatabase(data: any): Observable<any> {
    console.log('🚀 Enviando a:', `${this.baseUrl}/databases`);
    console.log('🚀 Datos:', data);
    const url = `${this.baseUrl}/databases`;
    const key = this.createRequestKey('POST', url, data);
    return this.runWithInflightControl(key, () =>
      this.http.post(url, data, this.httpOptionsWithCredentials).pipe(
        tap(() => this.invalidateCache('databases'))
      )
    ); // ✅ Con headers
  }

  updateDatabase(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/databases/${id}`;
    const key = this.createRequestKey('PUT', url, data);
    return this.runWithInflightControl(key, () =>
      this.http.put(url, data, this.httpOptionsWithCredentials).pipe(
        tap(() => this.invalidateCache('databases'))
      )
    ); // ✅ Con headers
  }

  // deleteDatabase(id: number): Observable<any> {
  //   return this.http.delete(`${this.baseUrl}/databases/${id}`, this.httpOptions); // ✅ Con headers
  // }

  deleteDatabase(id: number, id_user: number) {
    const url = `${this.baseUrl}/databases/${id}`;
    const key = this.createRequestKey('DELETE', url, { id_user });
    return this.runWithInflightControl(key, () =>
      this.http.delete(url, {
        body: { id_user }, // 👈 enviamos el id_user en el cuerpo del DELETE
        headers: this.httpOptionsWithCredentials.headers
      }).pipe(
        tap(() => this.invalidateCache('databases'))
      )
    );
  }

  // --- CONNECTIONS ---
  getConnection(forceRefresh = false): Observable<any> {
    const cacheKey = 'connections';
    if (!forceRefresh) {
      const cached = this.getCache<any>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }

    return this.http.get(`${this.baseUrl}/connections`).pipe(
      tap(res => this.setCache(cacheKey, res))
    );
  }

  addConnection(data: any): Observable<any> {
    console.log('🚀 Datos:', data);
    const url = `${this.baseUrl}/connections`;
    const key = this.createRequestKey('POST', url, data);
    return this.runWithInflightControl(key, () =>
      this.http.post(url, data).pipe(
        tap(() => this.invalidateCache('connections'))
      )
    );
  }

  updateConnection(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/connections/${id}`;
    const key = this.createRequestKey('PUT', url, data);
    return this.runWithInflightControl(key, () =>
      this.http.put(url, data, this.httpOptionsWithCredentials).pipe(
        tap(() => this.invalidateCache('connections'))
      )
    ); // ✅ Con headers
  }

  deleteConnection(id: number, id_user: number) {
    const url = `${this.baseUrl}/connections/${id}`;
    const key = this.createRequestKey('DELETE', url, { id_user });
    return this.runWithInflightControl(key, () =>
      this.http.delete(url, {
        body: { id_user }, // 👈 enviamos el id_user en el cuerpo del DELETE
        headers: this.httpOptionsWithCredentials.headers
      }).pipe(
        tap(() => this.invalidateCache('connections'))
      )
    );
  }

// --- COLLECTIONS ---
getCollections(dbId: string, forceRefresh = false): Observable<any> {
  const cacheKey = `collections_${dbId}`;
  if (!forceRefresh) {
    const cached = this.getCache<any>(cacheKey);
    if (cached) {
      return of(cached);
    }
  }
  return this.http.get(`${this.baseUrl}/mongo/${dbId}/collections`).pipe(
    tap(res => this.setCache(cacheKey, res))
  );
}

getCollectionData(dbId: string, collection: string, forceRefresh = false, sample?: number): Observable<any> {
  const cacheKey = `collection_${dbId}_${collection}_${sample || 'default'}`;
  if (!forceRefresh) {
    const cached = this.getCache<any>(cacheKey);
    if (cached) {
      return of(cached);
    }
  }
  let url = `${this.baseUrl}/mongo/${dbId}/collections/${collection}`;
  if (sample) {
    url += `?sample=${sample}`;
  }
  return this.http.get(url).pipe(
    tap(res => this.setCache(cacheKey, res))
  );
}

getDocument(dbId: string, collection: string, docId: string, forceRefresh = false): Observable<any> {
  const cacheKey = `document_${dbId}_${collection}_${docId}`;
  if (!forceRefresh) {
    const cached = this.getCache<any>(cacheKey);
    if (cached) {
      return of(cached);
    }
  }
  return this.http.get(`${this.baseUrl}/mongo/${dbId}/collections/${collection}/${docId}`).pipe(
    tap(res => this.setCache(cacheKey, res))
  );
}
// --- SIMULATIONS ---

  getSimulation(forceRefresh = false): Observable<any> {
    const cacheKey = 'simulation';
    if (!forceRefresh) {
      const cached = this.getCache<any>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }
    return this.http.get(`${this.baseUrl}/get_simulation`).pipe(
      tap(res => this.setCache(cacheKey, res))
    );
  }

  storeSimulation(data: any): Observable<any> {
    const url = `${this.baseUrl}/store_data`;
    const key = this.createRequestKey('POST', url, data);
    return this.runWithInflightControl(key, () =>
      this.http.post(url, data).pipe(
        tap(() => this.invalidateCache('simulation'))
      )
    );
  }

  sendSimulation(data: any): Observable<any> {
    console.log('🚀 Datos:', data);
    const url = `${this.baseUrl}/send_data`;
    const key = this.createRequestKey('POST', url, data);
    return this.runWithInflightControl(key, () =>
      this.http.post(url, data)
    );
  }

  // --- LOGS ---

  getLogs(forceRefresh = false): Observable<any> {
    const cacheKey = 'logs';
    if (!forceRefresh) {
      const cached = this.getCache<any>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }
    return this.http.get(`${this.baseUrl}/logs`).pipe(
      tap(res => this.setCache(cacheKey, res))
    );
  }

  storeLogs(data: any): Observable<any> {
    const url = `${this.baseUrl}/store_logs`;
    const key = this.createRequestKey('POST', url, data);
    return this.runWithInflightControl(key, () =>
      this.http.post(url, data).pipe(
        tap(() => this.invalidateCache('logs'))
      )
    );
  }

  // --- USERS ---

  getUsers(forceRefresh = false): Observable<any> {
    const cacheKey = 'users';
    if (!forceRefresh) {
      const cached = this.getCache<any>(cacheKey);
      if (cached) {
        return of(cached);
      }
    }
    return this.http.get(`${this.baseUrl}/users`).pipe(
      tap(res => this.setCache(cacheKey, res))
    );
  }

  // Agregar este método a tu api.service.ts existente

  /**
   * Verifica el estado de una simulación por su RequestID
   */
  checkSimulationStatus(requestId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/check-simulation-status`, { requestId });
  }

}