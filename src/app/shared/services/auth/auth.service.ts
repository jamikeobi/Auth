import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  // Existing subjects for auth and user data
  private _auth: BehaviorSubject<any> = new BehaviorSubject(null);
  private _user: BehaviorSubject<any> = new BehaviorSubject(null);
  user: Observable<any> = this._user.asObservable();

  private readonly baseUrl: string = environment.api;

  constructor(
    private scriptService: ScriptsService,
    private deviceService: DeviceService,
    private http: HttpClient
  ) {
    // Initialize auth state on service creation
    this._authState.next(this.isAuth());
  }

  // Methods for login type
  setLoginType(type: 'traditional' | 'blockchain'): void {
    this._loginType.next(type);
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
          this._authState.next(true); // Update auth state on successful login
        })
      );
  }

  store(token: string): void {
    const encrypted = this.scriptService.encryptSha256(token);
    localStorage.setItem('session', encrypted);
    this._authState.next(true); // Update auth state when storing token
  }

  getAuthData(): any {
    const session = localStorage.getItem('session');
    if (!session) {
      this.clear();
      return undefined;
    }

    try {
      const data = this.scriptService.decryptSha256(session);
      return JSON.parse(data);
    } catch (error) {
      this.clear();
      return undefined;
    }
  }

  isAuth(): boolean {
    const authData = this.getAuthData();
    if (!authData || !authData.token) {
      this._authState.next(false);
      return false;
    }

    try {
      const codeToken = JSON.parse(this.scriptService.decryptSha256(authData.codeToken));
      const isExpired = Date.now() > (codeToken.timestamp + codeToken.expires);
      
      if (isExpired) {
        this.deviceService.oInfoNotification('Session Expired', 'Please login again');
        this.clear();
        this._authState.next(false);
        return false;
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
    localStorage.removeItem('session');
    this._user.next(null);
    this._auth.next(null);
    this._authState.next(false);
  }
  logout(): void {
    this.clear(); // Clear local storage and reset subjects
    this.setLoginType('traditional');
    this.setAuthState(false);
  }

  private handleError(error: any): Observable<never> {
    this.deviceService.oErrorNotification('Oops', error.error?.message || 'An error occurred');
    return throwError(() => error);
  }
}