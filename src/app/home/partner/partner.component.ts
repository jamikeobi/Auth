import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeviceService } from 'src/app/shared/services/client/device.service';

@Component({
  selector: 'app-partner',
  templateUrl: './partner.component.html',
  styleUrls: ['./partner.component.scss']
})
export class PartnerComponent implements OnInit {
  partnerForm: FormGroup;
  apiToken: string;
  websites: any[] = [];

  constructor(
    private fb: FormBuilder,
    private ds: DeviceService,
    private authService: AuthService
  ) {
    // Initialize form
    this.partnerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      websiteUrl: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/)]],
      successUrl: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/)]],
      errorUrl: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/)]],
      logoUrl: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?\.(png|jpg|jpeg|gif)$/i)]],
      Abv: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]]
    });

    // Initialize API token (in practice, fetch from AuthService)
    this.apiToken = this.generateToken();
  }

  ngOnInit(): void {
    // In a real app, fetch websites and token from a service
    // Example: this.authService.getWebsites().subscribe(data => this.websites = data);
    const u = this.authService.getAuthData();
    console.log(u);
    this.authService.setToken(u.user.current);
    this.authService.setApiKey(u.user.apikey);
  }

  onSubmit(): void {
    if (this.partnerForm.valid) {
      const formData = {
        name: this.partnerForm.get('name')?.value,
        websiteUrl: this.partnerForm.get('websiteUrl')?.value,
        successUrl: this.partnerForm.get('successUrl')?.value,
        errorUrl: this.partnerForm.get('errorUrl')?.value,
        logoUrl: this.partnerForm.get('logoUrl')?.value,
        Abv: this.partnerForm.get('Abv')?.value,
        totalLoginAttempt: 0,
        totalLoginSuccess: 0,
        totalLoginFailure: 0,
        totalNewly: 0
      };
      // Add to websites array (in practice, send to backend)
      this.websites.push(formData);
      console.log('API-ready data:', formData);
      this.partnerForm.reset(); // Reset form after submission
    } else {
      this.partnerForm.markAllAsTouched();
      console.log('Form is invalid');
    }
  }

  revokeToken(): void {
    // Generate new token (in practice, call AuthService to revoke and get new token)
    // this.apiToken = this.generateToken();
    console.log('API generated:', this.apiToken);
    this.authService.revokeApi({api: this.apiToken}).subscribe(
      c=>{
        this.authService.setApiKey(c.user.apikey);
        this.apiToken = c.user.apikey;
        console.log('New API generated:', this.apiToken);
        // this.generateToken()
      },
      e=>console.log(e)
    )
  }

  copyToken(): void {
    // Copy token to clipboard
    navigator.clipboard.writeText(this.apiToken).then(() => {
      console.log('Token copied to clipboard');
      alert('API Token copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy token:', err);
    });
  }

  deleteWebsite(index: number): void {
    // Remove website from array (in practice, call backend to delete)
    this.websites.splice(index, 1);
    console.log('Website deleted at index:', index);
  }

  private generateToken(): string {
    // Generate a simple random token (UUID-like for demo)
    const u = this.authService.getAuthData();
    console.log(u);
    this.authService.setToken(u.user.current);
    this.authService.setApiKey(u.user.apikey);
    return u.auth.apikey;
  }
}
