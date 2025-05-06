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

  // Methods for login type
  setLoginType(type: 'traditional' | 'blockchain'): void {
    this._loginType.next(type);
    this.saveSession(); // Update session storage with new login type
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
    this.saveSession(); // Update session storage with new auth state
  }

  getAuthState(): boolean {
    return this._authState.getValue();
  }

  getAuthStateObservable(): Observable<boolean> {
    return this.authState$;
  }

  register(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/sign-up`, data, {
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  login(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/sign-in`, data, {
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error)),
        tap((res: any) => {
          this._user.next(res.data);
          this._auth.next(res.data); // Update auth data
          this._authState.next(true);
          this._loginType.next('traditional');
          this.saveSession();
        })
      );
  }
  requestOtpLogin(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/otp-request`, data, {
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error)),
        // tap((res: any) => {
        //   this._user.next(res.data);
        //   this._auth.next(res.data); // Update auth data
        //   this._authState.next(true);
        //   this._loginType.next('traditional');
        //   this.saveSession();
        // })
      );
  }
  attemptOtpLogin(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/otp-sign-in`, data, {
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error)),
        tap((res: any) => {
          this._user.next(res.authResult.user);
          this._auth.next(res.authResult.user); // Update auth data
          this._authState.next(true);
          this._loginType.next('traditional');
          this.saveSession();
        })
      );
  }
  updatePassword(data: any): Observable<any> {
    const token = this.getAuthData()?.token || '';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http
      .post(`${this.baseUrl}/update-password`, data, {
        headers,
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error)),
        tap((res: any) => {
          this._user.next(res.authResult.user);
          this._auth.next(res.authResult.user); // Update auth data
          this._authState.next(true);
          this._loginType.next('traditional');
          this.saveSession();
        })
      );
  }

  attemptBlockchain(data: any): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/web3-sign-in`, data, {
        params: new HttpParams(),
      })
      .pipe(
        catchError(error => this.handleError(error)),
        tap((res: any) => {
          if (res.data && res.data.success) {
            const user = res.data.user;
            this._user.next(user);
            this._auth.next(user); // Update auth data
            this._authState.next(true);
            this._loginType.next('blockchain');
            this.saveSession();
          }
        })
      );
  }

  store(token: string): void {
    const sessionData = this.getSessionData() || {};
    sessionData.token = token;
    this._auth.next(sessionData);
    this.saveSession();
    this._authState.next(true);
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
        token: this._auth.getValue()?.token,
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
      console.log(sessionData);
      console.log(decryptedSession);

      this._user.next(sessionData.user || null);
      this._auth.next(sessionData.auth || null);
      this._loginType.next(sessionData.loginType || 'traditional');
      this._authState.next(true);
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
    this.deviceService.oErrorNotification('Oops', error.error?.message || 'An error occurred');
    return throwError(() => error);
  }
}
