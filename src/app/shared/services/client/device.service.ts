import {   ComponentFactoryResolver,
  Injectable,
  ViewContainerRef,
  Inject,
  ReflectiveInjector } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of, Subject } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap, map, shareReplay, switchMap, takeWhile } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { NotificationsService, Notification as Ang2Notification } from 'angular2-notifications';
import { ScriptsService } from './scripts.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { mkConfig, generateCsv, download } from "export-to-csv";

declare const $:any;
@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  apiUrl: string = environment.api;
  emailApiUrl: string = environment.emailApi;
  // mkConfig merges your options with the defaults
// and returns WithDefaults<ConfigOptions>
  private csvConfig = mkConfig({
      filename: 'Generated File At '+ Date.now(),
      replaceUndefinedWith: null,
    useKeysAsHeaders: true });
  toastOptions: any = {
    timeOut: 10000,
    showProgressBar: true,
    pauseOnHover: true,
    clickToClose: true,
    maxStack: 2,
    preventLastDuplicates: true,
  };
  private _modalOptions:any = {
    backdrop: false,
    keyboard: true,
    focus: true,
  }
  private _events: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  public get events(): any[] {
    return this._events.value;
  }
  public get events$(): Observable<any[]> {
    return this._events.asObservable();
  }
  public set events(value: any[]) {
    this._events.next(value);
  }
  private _modal:BehaviorSubject<Map<string, any>> = new BehaviorSubject<Map<string, any>>(new Map());
  private _appModal:Subject<Map<string, any>> = new Subject<Map<string, any>>();
                    private _loadedmodal:BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  _ip:BehaviorSubject<any> = new BehaviorSubject<any>('');

  modal$: Observable<Map<string, any>> = this._modal.asObservable();
  loadedmodal$: Observable<string[]> = this._loadedmodal.asObservable();
  ip$: Observable<string> = this._ip.asObservable();
  _getIp: Observable<any> = this.getIp().pipe(shareReplay());
  _conversations: BehaviorSubject<Map<string, any[]>> = new BehaviorSubject<Map<string, any[]>>(new Map());
  private listOfNotifications: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  showPageLoader: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  private _availableId: BehaviorSubject<number> = new BehaviorSubject<number>(this._sservice.generateRandomAlphanumeric(5));
  notifications$: Observable<any[]> = this.listOfNotifications.asObservable();
  private configuration: BehaviorSubject< any > = new BehaviorSubject({
    sideNavColor: ''
  });
  preference$: Observable <any> = this.configuration.asObservable().pipe(
    switchMap((_pref: any)=>{
      if(!this.localStorageSideNavColor && _pref.sideNavColor.length < 1){
        _pref.sideNavColor = '#021645';
      }
      if(!this.localStorageSideNavColor){
        this.setlocalStorageSideNavColor(_pref.sideNavColor);
      }

      return of(_pref);
    }),
    shareReplay()
  );
  private csv(data:any[]){ return generateCsv(this.csvConfig)(data)};
  public downloadcsv(data:any[]) {download(this.csvConfig)(this.csv(data))}

  rootViewContainer:any;

  constructor(
    @Inject(ComponentFactoryResolver) private factoryResolver: ComponentFactoryResolver,
    private http: HttpClient,
    private _sservice:ScriptsService,
    private _ns: NotificationsService,
    private spinner: NgxSpinnerService
    ) {
    this.configuration;
    this.factoryResolver = factoryResolver

   }
  private getNotificationsApi(user:any): Observable<any> {
    let headerParams = new HttpParams().set('user.userID', user.userID);
    return this.http.get(`${this.apiUrl}/notifications`, {params: headerParams});
  }
  getEventsApi(params:any): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-events/who_like=${params.who_like}`);
  }
  getMyScheduleApi(params:any): Observable<any> {
    return this.http.get(`${this.apiUrl}/schedule?participant_like=${params.participant}`);
  }
  // getAllScheduleApi(params:any): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/schedule/participant_like=${params.participant}`);
  // }
  newEventsApi(event:any): Observable<any> {
    return this.http.post(`${this.apiUrl}/events`,event);
  }
  newScheduleApi(schedule:any): Observable<any> {
    return this.http.post(`${this.apiUrl}/appointment-schedule`,schedule);
  }
  setRootViewContainerRef(viewContainerRef: ViewContainerRef) {
    this.rootViewContainer = viewContainerRef
  }
  addDynamicComponent(component_import:any) {
    const factory = this.factoryResolver
                        .resolveComponentFactory(component_import);
    const component = factory.create(this.rootViewContainer.parentInjector);
    this.rootViewContainer.insert(component.hostView);
    return component;
  }
  add(event: any) {
    return this.http.post(`${this.apiUrl}/notifications`, event).pipe(
      tap((evnt:any)=>{
        this.listOfNotifications.value.unshift(evnt);
        this.listOfNotifications.next(
          [
            ...this.listOfNotifications.value
          ]
        )
      })
    )
  }
  mail(event: any) {
    return this.http.post(`${this.emailApiUrl}`, event).pipe(
      tap((evnt:any)=>{

      })
    )
  }
  getIp(): Observable<any> {
    return this.http.get(`https://api.ipify.org/?format=json`).pipe(map((data:any)=>data.ip));
  }
  getMailConversationThread(params:any): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-conversations/who_like=${params.who_like}`, { params })
  }
  getContacts(params:any): Observable<any> {
    return this.http.get(`${this.apiUrl}/contacts/who_like=${params.who_like}`);
  }
  newContact(data:any): Observable<any> {
    return this.http.post(`${this.apiUrl}/contacts`, data);
  }
  messageTelegramAdmin(data:any): Observable<any> {
    return this.http.post(`${this.apiUrl}/telegram-message-admin`, data);
  }
  sendany(data:any): Observable<any> {
    return this.http.post(`${this.apiUrl}/conversation`, data)
  }
  updateany(data:any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/conversation/${data.id}`, data)
  }
  get availableId():number{
    const _availableId = this._availableId.value;
    this._availableId.next(this._sservice.generateRandomAlphanumeric(5));
    return _availableId;
  }
  private get localStorageSideNavColor(){
    return localStorage.getItem('_sidenavcolor');
  }

  private setlocalStorageSideNavColor(value:string){
    localStorage.setItem('_sidenavcolor',value);
  }

  setany(preference: any){
    this.setlocalStorageSideNavColor(preference.sideNavColor);
    this.configuration.next(preference)
  }


  openSuccessNotification(title:string, content: string, clickHandler?: Function ){
    const _fullOption = {...this.toastOptions,id: this.availableId}
    const toast = this._ns.success(title, content, _fullOption);

    toast.click?.pipe
    tap((event):any=>{

      // if(clickHandler){
      //   clickHandler();
      // }
    })
  }
  openErrorNotification(title:string, content: string, clickHandler?: Function ){
    const toast = this._ns.error(title, content, this.toastOptions);
    toast.click?.subscribe((event)=>{
      if(clickHandler){
        clickHandler();
      }
    })
  }
  oErrorNotification(title:string, content: string,options:Ang2Notification = this.toastOptions ){
    this.toastOptions = {...this.toastOptions,id: this.availableId}
    const list = this.listOfNotifications.value;
    const today: any = new Date(Date.now());
    list.unshift({
      id: this.toastOptions.id,
      title,
      message: content,
      status: 'unseen',
      created_at: today,
      updated_at: today
    })
    this.listOfNotifications.next(list);
    this._ns.error(title, content, {...options,id: this.toastOptions.id});
  }
  oSuccessNotification(title:string, content: string, options:Ang2Notification = this.toastOptions ){
    this.toastOptions = {...this.toastOptions,id: this.availableId};
    const list = this.listOfNotifications.value;
    const today: any = new Date(Date.now());
    list.unshift({
      id: this.toastOptions.id,
      title,
      message: content,
      status: 'unseen',
      created_at: today,
      updated_at: today
    })
    this.listOfNotifications.next(list);
    this._ns.success(title, content, {...options,id: this.toastOptions.id});
  }
  oInfoNotification(title:string, content: string, options:Ang2Notification = this.toastOptions ){
    this.toastOptions = {...this.toastOptions,id: this.availableId}
    const list = this.listOfNotifications.value;
    const today: any = new Date(Date.now());
    list.unshift({
      id: this.toastOptions.id,
      title,
      message: content,
      status: 'unseen',
      created_at: today,
      updated_at: today
    })
    this.listOfNotifications.next(list);
    this._ns.info(title, content, {...options,id: this.toastOptions.id});
  }
  openInfoNotification(title:string, content: string, clickHandler?: Function ){
    const toast = this._ns.info(title, content, this.toastOptions);
    toast.click?.subscribe((event)=>{
      if(clickHandler){
        clickHandler();
      }
    })
  }

  getHoliday(code: any): Observable<any> {
    const companycode:any = localStorage.getItem('runningCompany');
    let headerParams = new HttpParams().set('code_like',code).set('company_like', companycode);
    return this.http.get(`${this.apiUrl}/holidays`, {params: headerParams}).pipe(
      map(
        (res: any) => res.pop()
      )
    );
  }

  initModal(element:string, code:string, options?:any){
    // Call only when jquery is initalized

    if(element && $(element) && this.loadedmodals_.indexOf(element) <0){
      let opt = Object.assign({...this._modalOptions}, {...options});
      let modal = $(element).modal(opt);
      const source = {
        element,
        code,
        modal
      };
      this.newmodal(element, source);
      return this.modal_.get(element);
    }
    return undefined;
  }
  newmodal(code:any, loadedModal:any){
    const modal_ = new Map().set(code, loadedModal);
    this._modal.next(modal_);
    const values = this.loadedmodals_;
    values.unshift(code);
    this._loadedmodal.next(values);
  }

  showSpinner(name?:any){

    this.spinner.show(name, { type: 'ball-scale-multiple' }); // start foreground spinner of the master loader with 'default' taskId
  }

  hideSpinner(name?:any){
    this.spinner.hide(name); // stop foreground spinner of the master loader with 'default' taskId
  }

  get modalViewed(){
    return this.modal_.size;
  }
  get modal_(){

    return this._modal.value;
  }
  get loadedmodals_(){
    return this._loadedmodal.value;
  }
  get days(){
    return [
      'monday', 'tuesday', 'wednesday',
      'thursday', 'friday', 'saturday','sunday'
    ]
  }
  get times(){
    return [
      '00:00 AM','01:00 AM','02:00 AM', '03:00 AM', '04:00 AM','05:00 AM','06:00 AM','07:00 AM',
      '08:00 AM','09:00 AM','10:00 AM', '11:00 AM', '12:00 PM','13:00 PM','14:00 PM','15:00 PM',
      '16:00 PM','17:00 PM','18:00 PM', '19:00 PM', '20:00 PM','21:00 PM','22:00 PM','23:00 PM', '24:00PM'

    ]
  }

}
