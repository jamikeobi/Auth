import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { IndexComponent } from './index/index.component';
import { SharedModule } from '../shared/shared.module';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotComponent } from './forgot/forgot.component';
import { LandingComponent } from './landing/landing.component';
import { PartnerComponent } from './partner/partner.component';


@NgModule({
  declarations: [
    IndexComponent,
    LoginComponent,
    RegisterComponent,
    ForgotComponent,
    LandingComponent,
    PartnerComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    SharedModule
  ]
})
export class HomeModule { }

