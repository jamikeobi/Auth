import {  NgModule } from '@angular/core';

import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { ErrorInterceptor } from './shared/interceptors/error.interceptor';
import { DeviceInfoInterceptor } from './shared/interceptors/device-info.interceptor';
import { UrlCachingInterceptor } from './shared/interceptors/url-caching.interceptor';
import { HeaderInterceptor } from './shared/interceptors/header.interceptor';
import { LoaderInterceptor } from './shared/interceptors/loader.interceptor';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
  declarations: [
    AppComponent,



  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatIconModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SimpleNotificationsModule.forRoot()
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: DeviceInfoInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: UrlCachingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HeaderInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
