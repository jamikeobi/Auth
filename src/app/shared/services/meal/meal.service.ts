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
export class MealService {
  // setting the private base url from the environment file
  private _apiUrl: string = environment.api;
  // setting a private list in the service to store the list of meal to be shared across all components (BehaviorSubject)
  private _meals: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
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
  // A public variable to dynamically get the value of all meal as an observable using the .subscribe
  meals$: Observable<any[]> = this._meals.asObservable();
  // A public variable to initally fetch all meals from the server
  fetch$: Observable<any[]> = this.ipAddress$.pipe(
    switchMap(ip => this.all()),
    shareReplay(1)
  );

  constructor(private http: HttpClient, private deviceService: DeviceService) { }

  /**
   * Calls the Server to get a single record of meal.
   * @param code The code of meal in search of.
   * @return A response of object <Observable> {message:string, data: Meal}.
   */
   read(id: any): Observable<any> {
    return this.ipAddress$.pipe(
      switchMap(ip => this.http.get(`${this._apiUrl}/meal/read`, {
        params: new HttpParams().set('_who', ip).set('id', id),
      }).pipe(
        map((r: any) => r.data),
        catchError(e => this._handleError(e))
      )),
      shareReplay(1)
    );
  }
  /**
   * Calls the Server to create a single record of meal.
   * @param meal The meal to store.
   * @return A response of object <Observable> {message:string, data: Meal}.
   */
  create(meal: any): Observable<any> {
    return this.http
      .post(`${this._apiUrl}/meal/create`, meal, {
        params: this._headerParams,
      })
      .pipe(
        catchError(e => this._handleError(e)),
        tap((res: any) => {
          const updatedList = this._meals.value;
          updatedList.push(res.data);
          this._meals.next(updatedList);
        })
      );
  }
  /**
   * Calls the Server to delete a single record of meal.
   * @param code The meal code you wish to delete.
   * @return A response of object <Observable> {message:string, data: Meal}.
   */
  delete(code: any): Observable<any> {
    return this.http.delete(`${this._apiUrl}/meal/delete`, {
      params: this._headerParams.set('code', code),
    }).pipe(
      catchError(e => this._handleError(e))
    );
  }
  /**
   * Calls the Server to update a record of meal.
   * @param code The meal code you wish to update.
   * @param data The updated meal you wish to update.
   * @return A response of object <Observable> {message:string, data: Meal}.
   */
  update(code: any, data: any): Observable<any> {
    return this.http.patch(`${this._apiUrl}/meal/update`, data, {
      params: this._headerParams.set('code', code),
    }).pipe(
      tap((res: any) => {
        const updatedList = this._meals.value;
        const index = updatedList.findIndex(d => d.code == res.data.code);
        updatedList[index] = res.data;
        this._meals.next(updatedList);
      }),
      catchError(e => this._handleError(e))
    );
  }
  /**
   * Calls the Server to get all records of meal.
   * @return A response of object <Observable> {message:string, data: Meal[]}.
   */
  all(): Observable<any> {
    return this.http.get(`${this._apiUrl}/meal/all`, {
      params: this._headerParams,
    }).pipe(
      map((a: any) => a.data),
      tap(a => this._meals.next(a)),
      catchError(e => this._handleError(e))
    );
  }
  /**
   * Calls the Server to get a single record of meal.
   * @return An array of Meal.
   */
  get meals(): any[] {
    return this._meals.value;
  }
  set meals(value: any) {
    this._meals.next(value);
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
