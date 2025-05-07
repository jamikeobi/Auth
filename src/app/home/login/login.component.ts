import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { DeviceService } from 'src/app/shared/services/client/device.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  passwordVisibility: string = 'Show';
  user: any = null;
  isOtpLogin: boolean = false;
  otpSuccess: boolean = false;

  private emailPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private passwordPattern: RegExp = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  constructor(
    private deviceService: DeviceService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      password: ['', [Validators.pattern(this.passwordPattern)]],
      word: [''],
      position: [''],
      isFirstTimeUser: [false],
      code: ['']
    });
  }

  ngOnInit(): void {
    // Dynamically update validators based on email input and OTP mode
    this.loginForm.get('email')?.valueChanges.subscribe(email => {
      if (this.isOtpLogin) {
        this.loginForm.get('password')?.clearValidators();
        this.loginForm.get('word')?.clearValidators();
        this.loginForm.get('position')?.clearValidators();
        this.loginForm.get('isFirstTimeUser')?.clearValidators();
      } else if (this.isAuthEmail(email)) {
        this.loginForm.get('password')?.clearValidators();
        this.loginForm.get('word')?.setValidators([Validators.required]);
        this.loginForm.get('position')?.setValidators([Validators.required]);
      } else {
        this.loginForm.get('password')?.setValidators([Validators.required, Validators.pattern(this.passwordPattern)]);
        this.loginForm.get('word')?.clearValidators();
        this.loginForm.get('position')?.clearValidators();
      }
      this.loginForm.get('password')?.updateValueAndValidity();
      this.loginForm.get('word')?.updateValueAndValidity();
      this.loginForm.get('position')?.updateValueAndValidity();
      this.loginForm.get('isFirstTimeUser')?.updateValueAndValidity();
    });

    // Update code validator when user is in two-factor mode
    this.loginForm.get('code')?.valueChanges.subscribe(() => {
      if (this.user && this.user.status === 0) {
        this.loginForm.get('code')?.setValidators([Validators.required]);
      } else {
        this.loginForm.get('code')?.clearValidators();
      }
      this.loginForm.get('code')?.updateValueAndValidity();
    });
  }

  isAuthEmail(email: string = this.loginForm.get('email')?.value): boolean {
    return email.toLowerCase().endsWith('@auth.com');
  }

  async submit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.deviceService.openInfoNotification('Oops', 'Please fill in all required fields correctly');
      return;
    }

    const formValue = this.loginForm.value;

    if (this.isOtpLogin) {
      this.deviceService.showSpinner();
      this.authService.requestOtpLogin({email: formValue.email}).subscribe({
        next: (res: any) => {
          console.log(res);
          this.otpSuccess = true;
          this.deviceService.hideSpinner();
          this.deviceService.oSuccessNotification('Success', 'Login link sent to your email!');
        },
        error: () => {
          this.deviceService.hideSpinner();
          this.deviceService.openInfoNotification('Error', 'Failed to send OTP link');
        }
      });
      return;
    }

    let loginPassword: string;

    if (this.isAuthEmail()) {
      // Generate password for @auth.com emails
      loginPassword = `${formValue.word}_${formValue.position}`;
      console.log('Generated Password:', loginPassword);
    } else {
      loginPassword = formValue.password;
    }

    this.deviceService.showSpinner();
        // Fetch IP address
        let ip = '0.0.0.0'; // Fallback IP
        try {
          ip = await this.deviceService.getIp().toPromise();
        } catch (err) {
          console.error('Failed to fetch IP:', err);
          this.deviceService.oErrorNotification('Error', 'Failed to fetch IP address, using fallback IP');
        }
    this.authService.login({
      email: formValue.email,
      password: loginPassword,
      isFirstTimeUser: formValue.isFirstTimeUser,
      ip
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
    if (this.loginForm.get('code')?.invalid) {
      this.loginForm.get('code')?.markAsTouched();
      this.deviceService.openInfoNotification('Oops', 'Please enter a valid code');
      return;
    }

    console.log('Form submitted successfully');
    console.log('Code:', this.loginForm.get('code')?.value);
  }

  getMaskedEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocalPart = localPart.length > 4
      ? localPart.substring(0, 4) + '****'
      : localPart + '****';
    return `${maskedLocalPart}@${domain}`;
  }

  reset(): void {
    this.loginForm.reset({
      email: '',
      password: '',
      word: '',
      position: '',
      isFirstTimeUser: false,
      code: ''
    });
    this.user = null;
    this.passwordVisibility = 'Show';
    this.isOtpLogin = false;
    this.otpSuccess = false;
  }

  resetToDefaultLogin(): void {
    this.loginForm.reset({
      email: '',
      password: '',
      word: '',
      position: '',
      isFirstTimeUser: false,
      code: ''
    });
    this.isOtpLogin = false;
    this.otpSuccess = false;
    this.passwordVisibility = 'Show';
  }

  togglepasswordVisibility(): void {
    this.passwordVisibility = this.passwordVisibility === 'Show' ? 'Hide' : 'Show';
  }

  otpLogin(): void {
    this.isOtpLogin = true;
    this.otpSuccess = false;
    this.loginForm.get('email')?.setValue('');
    this.loginForm.get('password')?.reset();
    this.loginForm.get('word')?.reset();
    this.loginForm.get('position')?.reset();
    this.loginForm.get('isFirstTimeUser')?.reset();
  }
}