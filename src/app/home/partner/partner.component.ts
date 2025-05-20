import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeviceService } from 'src/app/shared/services/client/device.service';
import { Router } from '@angular/router';

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
    private authService: AuthService,
    private router: Router
  ) {
    // Initialize form
    this.partnerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      websiteUrl: ['', [
        Validators.required,
        Validators.pattern(/^(?:(?:https?:\/\/)?(?:localhost(?::\d+)?|[\w-]+\.[\w-]+(?:\.[\w-]+)*)(?:\/[\w- ./?%&=]*)?)?$/)
      ]],
      successUrl: ['', [
        Validators.required,
        Validators.pattern(/^(?:(?:https?:\/\/)?(?:localhost(?::\d+)?|[\w-]+\.[\w-]+(?:\.[\w-]+)*)(?:\/[\w- ./?%&=]*)?)?$/)
      ]],
      errorUrl: ['', [
        Validators.required,
        Validators.pattern(/^(?:(?:https?:\/\/)?(?:localhost(?::\d+)?|[\w-]+\.[\w-]+(?:\.[\w-]+)*)(?:\/[\w- ./?%&=]*)?)?$/)
      ]],
      logoUrl: ['', [Validators.required]],Abv: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]]
      
    });

    // Initialize API token from AuthService
    const u = this.authService.getAuthData();
    this.apiToken = u?.auth?.apikey || '';
  }

  ngOnInit(): void {
    // Set token and apiKey from session
    const u = this.authService.getAuthData();
    if (u?.user?.current && u?.user?.apikey) {
      this.authService.setToken(u.user.current);
      this.authService.setApiKey(u.user.apikey);
      this.apiToken = u.user.apikey;
    } else {
      this.ds.oErrorNotification('Error', 'Session data missing. Please login again.');
      this.router.navigate(['']);
    }

    // Load websites
    this.loadWebsites();
  }

  /**
   * Loads API websites from the backend using AuthService.
   */
  private loadWebsites(): void {
    this.ds.showSpinner();
    this.authService.getApiWebsites({}).subscribe({
      next: (res) => {
        console.log(res);
        this.ds.hideSpinner();
        if (res.success) {
          this.websites = res.apis || [];
          this.ds.oSuccessNotification('Success', 'API websites loaded successfully');
        } else {
          this.ds.oErrorNotification('Error', 'Failed to load API websites');
        }
      },
      error: (err) => {
        this.ds.hideSpinner();
        this.ds.oErrorNotification('Error', 'Failed to load API websites: ' + (err.error?.error || 'Unknown error'));
        console.error('Error loading websites:', err);
      }
    });
  }

  /**
   * Handles form submission to save a new API website.
   */
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

      this.ds.showSpinner();
      this.authService.saveApiWebsite(formData).subscribe({
        next: (res) => {
          console.log(res);
          this.ds.hideSpinner();
          if (res.success) {
            this.loadWebsites();
            this.partnerForm.reset();
            this.ds.oSuccessNotification('Success', 'API website saved successfully');
          } else {
            this.ds.oErrorNotification('Error', 'Failed to save API website');
          }
        },
        error: (err) => {
          this.ds.hideSpinner();
          this.ds.oErrorNotification('Error', 'Failed to save API website: ' + (err.error?.error || 'Unknown error'));
          console.error('Error saving website:', err);
        }
      });
    } else {
      this.partnerForm.markAllAsTouched();
      this.ds.oErrorNotification('Error', 'Please fill all required fields correctly');
      console.log('Form is invalid');
    }
  }

  /**
   * Revokes the current API token and logs out.
   */
  revokeToken(): void {
    this.ds.showSpinner();
    this.authService.revokeApi({ api: this.apiToken }).subscribe({
      next: (res) => {
        this.ds.hideSpinner();
        if (res.user?.apikey) {
          this.authService.setApiKey(res.user.apikey);
          this.apiToken = res.user.apikey;
          this.authService.logout();
          this.router.navigate(['']).finally(() => {
            this.ds.oInfoNotification('API Revoked', 'Please login again');
          });
        } else {
          this.ds.oErrorNotification('Error', 'Failed to revoke API token');
        }
      },
      error: (err) => {
        this.ds.hideSpinner();
        this.ds.oErrorNotification('Error', 'Failed to revoke API token: ' + (err.error?.error || 'Unknown error'));
        console.error('Error revoking token:', err);
      }
    });
  }

  /**
   * Copies the API token to the clipboard.
   */
  copyToken(): void {
    navigator.clipboard.writeText(this.apiToken).then(() => {
      this.ds.oSuccessNotification('Success', 'API token copied to clipboard');
    }).catch(err => {
      this.ds.oErrorNotification('Error', 'Failed to copy token');
      console.error('Failed to copy token:', err);
    });
  }

  /**
   * Deletes an API website by index.
   *
   * @param index - The index of the website to delete.
   */
  deleteWebsite(index: number): void {
    this.ds.showSpinner();
    this.authService.deleteApiWebsite({ index }).subscribe({
      next: (res) => {
        console.log(res);
        this.ds.hideSpinner();
        if (res.success) {
          this.loadWebsites();
          this.ds.oSuccessNotification('Success', 'API website deleted successfully');
        } else {
          this.ds.oErrorNotification('Error', 'Failed to delete API website');
        }
      },
      error: (err) => {
        this.ds.hideSpinner();
        this.ds.oErrorNotification('Error', 'Failed to delete API website: ' + (err.error?.error || 'Unknown error'));
        console.error('Error deleting website:', err);
      }
    });
  }
}
