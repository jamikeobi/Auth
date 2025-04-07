import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { DeviceService } from 'src/app/shared/services/client/device.service';
import { Web3Service } from 'src/app/shared/services/crypto/web3.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  email: string = ''; // access to form email
  password: string = ''; // access to form password
  code: string = ''; // access to form code
  errors: string[] = []; // array to store error messages
  emailError: boolean = false; // state for email error
  passwordError: boolean = false; // state for password error
  codeError: boolean = false; // state for code error

  user:any = null;
  constructor(private deviceService:DeviceService, private authService:AuthService, private web3Service:Web3Service) {}

  ngOnInit(): void {}

  // Sign-in trigger
  async submit()  {
    // Clear previous errors
    this.errors = [];
    await this.web3Service.connectAccount();

    // Check for errors
    // if (this.errors.length > 0) {
    //   this.deviceService.openInfoNotification('Oops', this.errors.toLocaleString())
    //   console.error('Errors:', this.errors);
    //   return;
    // }
    // this.authService.register({email:this.email, password: this.password}).subscribe(
    //   (res:any)=>{
    //     this.user = res.data;
    //   }
    // )

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
    const signIn:any = document.getElementById('signIn');
    console.log(signIn);
    signIn.click();
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

