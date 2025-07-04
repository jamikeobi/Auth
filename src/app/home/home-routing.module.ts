import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { LandingComponent } from './landing/landing.component';
import { AuthGuard } from '../shared/guards/auth/auth.guard';
import { GuestGuard } from '../shared/guards/auth/guest.guard';
import { PartnerComponent } from './partner/partner.component';
import { LoginComponent } from './login/login.component';
const routes: Routes = [
  {
    path: '',
    component: IndexComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'login',
    component: IndexComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'otp/:token',
    component: IndexComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'register',
    component: IndexComponent,
    canActivate: [GuestGuard]
  },
  {
    path: 'landing',
    component: LandingComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'api',
    component: PartnerComponent,
    // canActivate: [AuthGuard]
  },
  {
    path: 'logins',
    component: LoginComponent,
    canActivate: [GuestGuard]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }
