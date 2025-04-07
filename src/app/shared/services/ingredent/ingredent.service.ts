import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import {
  tap,
  map,
  shareReplay,
  catchError,
  switchMap
} from 'rxjs/operators';
import { DeviceService } from '../client/device.service';

@Injectable({
  providedIn: 'root',
})
export class IngredentService {
  // setting the private base url from the environment file
  private _apiUrl: string = environment.api;
  // setting a private list in the service to store the list of ingredent to be shared across all components (BehaviorSubject)
  private _ingredents: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  // Setting the private variable for the headerParams
  private _headerParams: HttpParams = new HttpParams();
  ipAddress: any = null;
  ipAddress$: Observable<any> = this.deviceService.getIp().pipe(
    shareReplay(1),
    tap(ip => {
      this.ipAddress = ip;
      this._headerParams = new HttpParams().set('ip', ip)
    })
  )
  // A public variable to dynamically get the value of all ingredent as an observable using the .subscribe
  ingredents$: Observable<any[]> = this._ingredents.asObservable();
  // A public variable to initally fetch all ingredents from the server
  fetch$: Observable<any[]> = this.ipAddress$.pipe(
    switchMap(ip => this.all()),
    shareReplay(1)
  );

  constructor(private http: HttpClient, private deviceService: DeviceService) { }

  /**
   * Calls the Server to get a single record of ingredent.
   * @param code The code of ingredent in search of.
   * @return A response of object <Observable> {message:string, data: Ingredent}.
   */
   read(code: any): Observable<any> {
    return this.ipAddress$.pipe(
      switchMap(ip => this.http.get(`${this._apiUrl}/ingredent/read`, {
        params: new HttpParams().set('_who', ip).set('code', code),
      }).pipe(
        map((r: any) => r.data),
        catchError(e => this._handleError(e))
      )),
      shareReplay(1)
    );
  }
  /**
   * Calls the Server to create a single record of ingredent.
   * @param ingredent The ingredent to store.
   * @return A response of object <Observable> {message:string, data: Ingredent}.
   */
  create(ingredent: any): Observable<any> {
    return this.http
      .post(`${this._apiUrl}/ingredent/create`, ingredent, {
        params: this._headerParams,
      })
      .pipe(
        catchError(e => this._handleError(e)),
        tap((res: any) => {
          const updatedList = this._ingredents.value;
          updatedList.push(res.data);
          this._ingredents.next(updatedList);
        })
      );
  }
  /**
   * Calls the Server to delete a single record of ingredent.
   * @param code The ingredent code you wish to delete.
   * @return A response of object <Observable> {message:string, data: Ingredent}.
   */
  delete(code: any): Observable<any> {
    return this.http.delete(`${this._apiUrl}/ingredent/delete`, {
      params: this._headerParams.set('code', code),
    }).pipe(
      catchError(e => this._handleError(e))
    );
  }
  /**
   * Calls the Server to update a record of ingredent.
   * @param code The ingredent code you wish to update.
   * @param data The updated ingredent you wish to update.
   * @return A response of object <Observable> {message:string, data: Ingredent}.
   */
  update(code: any, data: any): Observable<any> {
    return this.http.patch(`${this._apiUrl}/ingredent/update`, data, {
      params: this._headerParams.set('code', code),
    }).pipe(
      tap((res: any) => {
        const updatedList = this._ingredents.value;
        const index = updatedList.findIndex(d => d.code == res.data.code);
        updatedList[index] = res.data;
        this._ingredents.next(updatedList);
      }),
      catchError(e => this._handleError(e))
    );
  }
  /**
   * Calls the Server to get all records of ingredent.
   * @return A response of object <Observable> {message:string, data: Ingredent[]}.
   */
  all(): Observable<any> {
    return this.http.get(`${this._apiUrl}/ingredent/all`, {
      params: this._headerParams,
    }).pipe(
      map((a: any) => a.data),
      tap(a => this._ingredents.next(a)),
      catchError(e => this._handleError(e))
    );
  }
  /**
   * Calls the Server to get a single record of ingredent.
   * @return An array of Ingredent.
   */
  get ingredents(): any[] {
    return this._ingredents.value;
  }
  set ingredents(value: any) {
    this._ingredents.next(value);
  }
  /**
   * Handles and displays the error with notification.
   * @return An Error.
   */
  private _handleError(e: any) {
    this.deviceService.oErrorNotification('Oops', e.message);
    return throwError(e);
  }
}
