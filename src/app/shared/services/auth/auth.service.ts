import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ScriptsService } from '../client/scripts.service';
import { DeviceService } from '../client/device.service';
import { environment } from 'src/environments/environment';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // BehaviorSubject for login type (traditional or blockchain)
  private _loginType: BehaviorSubject<'traditional' | 'blockchain'> = new BehaviorSubject<'traditional' | 'blockchain'>('traditional');
  private loginType$: Observable<'traditional' | 'blockchain'> = this._loginType.asObservable();

  // BehaviorSubject for auth state (true/false)
  private _authState: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private authState$: Observable<boolean> = this._authState.asObservable();

  // BehaviorSubject for apiKey
  private _apiKey: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public apiKey$: Observable<string | null> = this._apiKey.asObservable();

  // BehaviorSubject for token
  private _token: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public token$: Observable<string | null> = this._token.asObservable();

  // BehaviorSubject for parentUrl
  private _parentUrl: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public parentUrl$: Observable<string | null> = this._parentUrl.asObservable();

  // Subjects for auth and user data
  private _auth: BehaviorSubject<any> = new BehaviorSubject(null);
  private _user: BehaviorSubject<any> = new BehaviorSubject(null);
  user: Observable<any> = this._user.asObservable();

  private readonly baseUrl: string = environment.api;

  constructor(
    private scriptService: ScriptsService,
    private deviceService: DeviceService,
    private http: HttpClient
  ) {
    // Initialize auth state and restore session
    this.restoreSession();
  }

  // Public method to set parentUrl
  public setParentUrl(parentUrl: string | null): void {
    this._parentUrl.next(parentUrl);
    this.saveSession();
  }

  // Public method to get parentUrl
  public getParentUrl(): string | null {
    return this._parentUrl.getValue();
  }

  // Public method to set apiKey
  public setApiKey(apiKey: string | null): void {
    this._apiKey.next(apiKey);
    this.saveSession();
  }

  // Public method to set token
  public setToken(token: string | null): void {
    this._token.next(token);
    this._auth.next({ ...this._auth.getValue(), token });
    this.saveSession();
    this._authState.next(!!token);
  }

  // Methods for login type
  setLoginType(type: 'traditional' | 'blockchain'): void {
    this._loginType.next(type);
    this.saveSession();
  }

  getLoginType(): 'traditional' | 'blockchain' {
    return this._loginType.getValue();
  }

  getLoginTypeObservable(): Observable<'traditional' | 'blockchain'> {
    return this.loginType$;
  }

  // Methods for auth state
  setAuthState(state: boolean): void {
    this._authState.next(state);
    this.saveSession();
  }

  getAuthState(): boolean {
    return this._authState.getValue();
  }

  getAuth(): any {
    return this._auth.getValue();
  }

  getAuthStateObservable(): Observable<boolean> {
    return this.authState$;
  }

  // Helper method to create headers with apiKey and token
  private createHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this._token.getValue();
    const apiKey = this._apiKey.getValue();
    console.log(token);

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (apiKey) {
      headers = headers.set('apiKey', apiKey);
    }
    console.log(headers);

    return headers;
  }

  revokeApi(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/revoke-api`, data, {
        headers: this.createHeaders(),
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  register(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/sign-up`, data, {
        headers: this.createHeaders(),
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  login(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/sign-in`, data, {
        headers: this.createHeaders(),
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error)),
        tap((res: any) => {
          this._user.next(res.data);
          this._auth.next(res.data);
          this._token.next(res.data?.token || null); // Assuming response includes token
          this._authState.next(true);
          this._loginType.next('traditional');
          this.saveSession();
        })
      );
  }

  requestOtpLogin(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/otp-request`, data, {
        headers: this.createHeaders(),
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  attemptOtpLogin(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/otp-sign-in`, data, {
        headers: this.createHeaders(),
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error)),
        tap((res: any) => {
          this._user.next(res.authResult.user);
          this._auth.next(res.authResult.user);
          this._token.next(res.authResult.user?.token || null); // Assuming token in response
          this._authState.next(true);
          this._loginType.next('traditional');
          this.saveSession();
        })
      );
  }

  updatePassword(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/update-password`, data, {
        headers: this.createHeaders(),
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error)),
        tap((res: any) => {
          this._user.next(res.authResult.user);
          this._auth.next(res.authResult.user);
          this._token.next(res.authResult.user?.token || null); // Assuming token in response
          this._authState.next(true);
          this._loginType.next('traditional');
          this.saveSession();
        })
      );
  }

  /**
   * Retrieves all API websites for the authenticated user.
   *
   * Sends a GET request to /api-websites to fetch the user's API records.
   *
   * @param data - Not used, included for consistency with other methods.
   * @returns Observable with the response containing the apis array.
   */
  getApiWebsites(data: any): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/api-websites`, {
        headers: this.createHeaders(),
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => {
          this.deviceService.oErrorNotification('Error', 'Failed to fetch API websites');
          return this.handleError(error);
        })
      );
  }

  verifyAndFetchApi(api: string): Observable<any> {
    let headers = new HttpHeaders();
    headers = headers.set('apiKey', api);
    return this.http
      .get(`${this.baseUrl}/apiis`, {
        headers,
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => {
          this.deviceService.oErrorNotification('Error', 'Failed to fetch API websites');
          return this.handleError(error);
        })
      );
  }

  /**
   * Saves a new API website for the authenticated user.
   *
   * Sends a POST request to /api-websites with the API data to create a new record.
   *
   * @param data - Object containing API details (name, websiteUrl, successUrl, errorUrl, logoUrl, Abv).
   * @returns Observable with the response containing the updated user record.
   */
  saveApiWebsite(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/api-websites`, data, {
        headers: this.createHeaders(),
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => {
          this.deviceService.oErrorNotification('Error', 'Failed to save API website');
          return this.handleError(error);
        }),
        tap((res: any) => {
          if (res.success && res.user) {
            this._user.next(res.user);
            this._auth.next(res.user);
            this.saveSession();
          }
        })
      );
  }

  /**
   * Updates an existing API website for the authenticated user.
   *
   * Sends a PATCH request to /api-websites with the index and updated API data.
   *
   * @param data - Object containing the index and updated API details (index, name, websiteUrl, etc.).
   * @returns Observable with the response containing the updated user record.
   */
  updateApiWebsite(data: any): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}/api-websites`, data, {
        headers: this.createHeaders(),
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => {
          this.deviceService.oErrorNotification('Error', 'Failed to update API website');
          return this.handleError(error);
        }),
        tap((res: any) => {
          if (res.success && res.user) {
            this._user.next(res.user);
            this._auth.next(res.user);
            this.saveSession();
          }
        })
      );
  }

  /**
   * Deletes an API website for the authenticated user.
   *
   * Sends a DELETE request to /api-websites with the index of the API record to delete.
   *
   * @param data - Object containing the index of the API record to delete.
   * @returns Observable with the response containing the updated user record.
   */
  deleteApiWebsite(data: any): Observable<any> {
    return this.http
      .delete(`${this.baseUrl}/api-websites`, {
        headers: this.createHeaders(),
        params: new HttpParams(),
        body: data
      })
      .pipe(
        catchError(error => {
          this.deviceService.oErrorNotification('Error', 'Failed to delete API website');
          return this.handleError(error);
        }),
        tap((res: any) => {
          if (res.success && res.user) {
            this._user.next(res.user);
            this._auth.next(res.user);
            this.saveSession();
          }
        })
      );
  }

  attemptBlockchain(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/web3-sign-in`, data, {
        headers: this.createHeaders(),
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error)),
        tap((res: any) => {
          if (res.data && res.data.success) {
            const user = res.data.user;
            this._user.next(user);
            this._auth.next(user);
            this._token.next(user?.token || null); // Assuming token in response
            this._authState.next(true);
            this._loginType.next('blockchain');
            this.saveSession();
          }
        })
      );
  }

  store(token: string): void {
    this.setToken(token); // Use setToken to update token and session
  }

  getAuthData(): any {
    const sessionData = this.getSessionData();
    return sessionData || undefined;
  }

  isAuth(): boolean {
    const sessionData = this.getSessionData();
    if (!sessionData || !sessionData.token) {
      this._authState.next(false);
      return false;
    }

    try {
      if (sessionData.codeToken) {
        const codeToken = JSON.parse(this.scriptService.decryptSha256(sessionData.codeToken));
        const isExpired = Date.now() > (codeToken.timestamp + codeToken.expires);

        if (isExpired) {
          this.deviceService.oInfoNotification('Session Expired', 'Please login again');
          this.clear();
          this._authState.next(false);
          return false;
        }
      }

      this._authState.next(true);
      return true;
    } catch (error) {
      this.clear();
      this._authState.next(false);
      return false;
    }
  }

  clear(): void {
    sessionStorage.removeItem('session');
    this._user.next(null);
    this._auth.next(null);
    this._authState.next(false);
    this._loginType.next('traditional');
    this._apiKey.next(null);
    this._token.next(null);
    this._parentUrl.next(null);
  }

  logout(): void {
    this.clear();
  }

  private saveSession(): void {
    try {
      const sessionData = {
        user: this._user.getValue(),
        auth: this._auth.getValue(),
        loginType: this._loginType.getValue(),
        token: this._token.getValue(),
        apiKey: this._apiKey.getValue(),
        parentUrl: this._parentUrl.getValue(),
        codeToken: this._auth.getValue()?.codeToken
      };
      const encryptedSession = this.scriptService.encryptSha256(JSON.stringify(sessionData));
      sessionStorage.setItem('session', encryptedSession);
    } catch (error) {
      console.error('Failed to encrypt and save session:', error);
      this.deviceService.oErrorNotification('Error', 'Failed to save session');
    }
  }

  private restoreSession(): void {
    const encryptedSession = sessionStorage.getItem('session');
    if (!encryptedSession) {
      this.clear();
      return;
    }

    try {
      const decryptedSession = this.scriptService.decryptSha256(encryptedSession);
      const sessionData = JSON.parse(decryptedSession);

      this._user.next(sessionData.user || null);
      this._auth.next(sessionData.auth || null);
      this._loginType.next(sessionData.loginType || 'traditional');
      this._apiKey.next(sessionData.apiKey || null);
      this._token.next(sessionData.token || null);
      this._parentUrl.next(sessionData.parentUrl || null);
      this._authState.next(!!sessionData.token);
    } catch (error) {
      console.error('Failed to decrypt and restore session:', error);
      this.deviceService.oErrorNotification('Error', 'Failed to restore session');
      this.clear();
    }
  }

  private getSessionData(): any {
    const encryptedSession = sessionStorage.getItem('session');
    if (!encryptedSession) {
      return null;
    }

    try {
      const decryptedSession = this.scriptService.decryptSha256(encryptedSession);
      return JSON.parse(decryptedSession);
    } catch (error) {
      console.error('Failed to decrypt session data:', error);
      this.clear();
      return null;
    }
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => error);
  }
}
