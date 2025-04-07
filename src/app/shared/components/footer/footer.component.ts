import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeviceService } from '../../services/client/device.service';
import { ScriptsService } from '../../services/client/scripts.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  subscriptionForm!: FormGroup;

  constructor(private formBuilder: FormBuilder, private ds: DeviceService, private scriptService: ScriptsService) { }

  ngOnInit(): void {
    this.subscriptionForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]]
    });
  }

  subscribe() {
    if (this.subscriptionForm.valid) {
      const email = this.subscriptionForm.value.email;
      // Handle subscription logic here
        this.ds.oSuccessNotification('Subscribed', 'Thank you for subscribing');
    }else{
      this.ds.oErrorNotification('Opps', 'Invalid email');
    }
  }

  navigateTo(url:string){
    this.scriptService.changePage(url);
  }

  changePage(){
    this.scriptService.changePage('/aboutus');
  }
}
