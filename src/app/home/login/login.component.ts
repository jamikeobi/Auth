import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { DeviceService } from 'src/app/shared/services/client/device.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email: string = ''; // access to form email
  password: string = ''; // access to form password
  code: string = ''; // access to form code
  errors: string[] = []; // array to store error messages
  emailError: boolean = false; // state for email error
  passwordError: boolean = false; // state for password error
  codeError: boolean = false; // state for code error

  user:any = null;
  constructor(private deviceService:DeviceService, private authService:AuthService) {}

  ngOnInit(): void {}

  // Sign-in trigger
  submit() {
    // Clear previous errors
    this.errors = [];
    this.emailError = false;
    this.codeError = false;
    this.passwordError = false;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation pattern
    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    // Validate email
    if (!emailPattern.test(this.email)) {
      this.emailError = true;
      this.errors.push('Invalid email format');
    }

    // Validate password
    if (!passwordPattern.test(this.password)){
    this.passwordError = true;
      this.errors.push(
        'Password must be at least 6 characters long, contain one uppercase letter, one number, and one special character'
      );
    }

    // Check for errors
    if (this.errors.length > 0) {
      this.deviceService.openInfoNotification('Oops', this.errors.toLocaleString())
      console.error('Errors:', this.errors);
      return;
    }
    this.authService.login({email:this.email, password: this.password}).subscribe(
      (res:any)=>{
        console.log(res)
        if(!res.data.id){
          this.deviceService.oErrorNotification('Oops', 'Incorrect email/password');
          this.passwordError = true;
          this.emailError = true;
        }else{
          this.user = res.data;
        }
      }
    )

    // If validation passes
    console.log('Form submitted successfully');
    console.log('Email:', this.email);
    console.log('Password:', this.password);
  }
  verify() {
    // Clear previous errors
    this.errors = [];
    this.emailError = false;
    this.codeError = false;
    this.passwordError = false;

    // Check for errors
    if (this.errors.length > 0) {
      this.deviceService.openInfoNotification('Oops', this.errors.toLocaleString())
      console.error('Errors:', this.errors);
      return;
    }

    // If validation passes
    console.log('Form submitted successfully');
    console.log('Code:', this.code);
  }
   // Reset error on input focus
   resetError(field: string) {
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
  reset(){
    this.email = '';
    this.password = '';
    this.errors = [];
    this.code = '';
    this.emailError = false;
    this.passwordError = false;
    this.codeError = false;
    this.user = null;
  }
}
