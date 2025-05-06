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

  constructor(private fb: FormBuilder,
    private ds: DeviceService,
  private authService: AuthService) {
    this.partnerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      websiteUrl: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/)]],
      successUrl: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/)]],
      errorUrl: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?$/)]],
      logoUrl: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- ./?%&=]*)?\.(png|jpg|jpeg|gif)$/i)]],
      Abv: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]]
    });
  }

  ngOnInit(): void {}

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
      console.log('API-ready data:', formData);
    } else {
      this.partnerForm.markAllAsTouched();
      console.log('Form is invalid');
    }
  }
}
