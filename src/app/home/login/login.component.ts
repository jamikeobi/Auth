import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { DeviceService } from 'src/app/shared/services/client/device.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email: string = '';
  password: string = '';
  passwordVisibility: string = 'Show';
  code: string = '';
  isFirstTimeUser: boolean = false; // New property for checkbox
  errors: string[] = [];
  emailError: boolean = false;
  passwordError: boolean = false;
  codeError: boolean = false;
  user: any = null;

  private emailPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private passwordPattern: RegExp = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  constructor(
    private deviceService: DeviceService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {}

  submit(): void {
    this.resetErrors();

    if (!this.emailPattern.test(this.email)) {
      this.emailError = true;
      this.errors.push('Invalid email format');
    }

    if (!this.passwordPattern.test(this.password)) {
      this.passwordError = true;
      this.errors.push(
        'Password must be at least 6 characters long, contain one uppercase letter, one number, and one special character'
      );
    }

    if (this.errors.length > 0) {
      this.deviceService.openInfoNotification('Oops', this.errors.join(', '));
      return;
    }

    this.deviceService.showSpinner();
    this.authService.login({ 
      email: this.email, 
      password: this.password,
      isFirstTimeUser: this.isFirstTimeUser // Include checkbox value in payload
    }).subscribe({
      next: (res: any) => {
        console.log('User logged in:', res.data);
        this.user = res.data;
          this.authService.setLoginType('traditional');
          this.authService.setAuthState(true);
          this.router.navigate(['/landing']).finally(() => 
            this.deviceService.oSuccessNotification('Success', 'Login successful!')
          );
      },
      error: () => this.deviceService.hideSpinner(),
      complete: () => this.deviceService.hideSpinner()
    });
  }

  verify(): void {
    this.resetErrors();

    if (this.errors.length > 0) {
      this.deviceService.openInfoNotification('Oops', this.errors.join(', '));
      return;
    }

    console.log('Form submitted successfully');
    console.log('Code:', this.code);
  }

  resetError(field: string): void {
    if (field === 'email') {
      this.emailError = false;
    } else if (field === 'password') {
      this.passwordError = false;
    } else if (field === 'code') {
      this.codeError = false;
    }
  }

  getMaskedEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocalPart = localPart.length > 4
      ? localPart.substring(0, 4) + '****'
      : localPart + '****';
    return `${maskedLocalPart}@${domain}`;
  }

  reset(): void {
    this.email = '';
    this.password = '';
    this.code = '';
    this.isFirstTimeUser = false; // Reset checkbox state
    this.errors = [];
    this.emailError = false;
    this.passwordError = false;
    this.codeError = false;
    this.user = null;
  }
  togglepasswordVisibility(){
    this.passwordVisibility = this.passwordVisibility === 'Show'? 'Hide' : 'Show';
  }

  private resetErrors(): void {
    this.errors = [];
    this.emailError = false;
    this.codeError = false;
    this.passwordError = false;
  }
}