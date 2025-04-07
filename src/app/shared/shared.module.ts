import { FooterComponent } from './components/footer/footer.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialExampleModule } from './material.module';
import { PageLoaderComponent } from './components/Index';
import { FlutterwaveModule } from "flutterwave-angular-v3"
import { HttpClientModule } from '@angular/common/http';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import {NgxPaginationModule} from 'ngx-pagination';
import { ArraySortPipe } from './pipes/array-sort.pipe';
import { SearchSortPipe } from './pipes/search-sort.pipe';
import { NgxSpinnerModule } from "ngx-spinner";
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {WebcamModule} from 'ngx-webcam';
import { SheduleMomentPipe } from './pipes/shedule-moment.pipe';
import { CustomTimerPipe } from './pipes/custom-timer.pipe';
import { NotifyComponent } from './components/notify/notify.component';
import {IvyCarouselModule} from 'angular-responsive-carousel';
// Import library module
import { NgxAudioPlayerModule } from 'ngx-audio-player';
import {RouterModule} from '@angular/router';
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';


@NgModule({
  declarations: [
    PageLoaderComponent,
    NotFoundComponent,
    ArraySortPipe,
    SearchSortPipe,
    SheduleMomentPipe,
    CustomTimerPipe,
    NotifyComponent,
    FooterComponent,
    AccessDeniedComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialExampleModule,
    FlutterwaveModule,
    HttpClientModule,
    AngularEditorModule,
    NgxPaginationModule,
    NgxSpinnerModule,
    WebcamModule,
    IvyCarouselModule,
    NgxAudioPlayerModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialExampleModule,
    PageLoaderComponent,
    HttpClientModule,
    FlutterwaveModule,
    NotFoundComponent,
    AngularEditorModule,
    NgxPaginationModule,
    ArraySortPipe,
    SearchSortPipe,
    NgxSpinnerModule,
    WebcamModule,
    SheduleMomentPipe,
    CustomTimerPipe,
    NotifyComponent,
    IvyCarouselModule,
    FooterComponent,
    NgxAudioPlayerModule,
    AccessDeniedComponent
  ]
})
export class SharedModule {
  static forRoot() {
    return {
      ngModule: SharedModule,
      providers: [
        MaterialExampleModule,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} }
      ],
    };
 }
 }
