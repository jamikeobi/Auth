import { AfterViewInit, Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { ScriptsService } from 'src/app/shared/services/client/scripts.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit, AfterViewInit {
  loggedIn:boolean = false;
  user = this.authService.user;
  constructor(private scriptService: ScriptsService, private authService:AuthService) { }

  ngOnInit(): void {
    this.user.subscribe(
      (r:any)=>{
        if(r && r.id){
          this.loggedIn = true;
        }
      }
    )
  }
  ngAfterViewInit(): void {
    const signUpButton: any = document.getElementById('signUp');
    const signInButton: any = document.getElementById('signIn');
    const alreadyAccountLink: any = document.getElementById('alreadyAccount');
    const container: any = document.getElementById('container');

    signUpButton.addEventListener('click', () => {
      container.classList.add("right-panel-active");
    });

    signInButton.addEventListener('click', () => {
      container.classList.remove("right-panel-active");
    });

    alreadyAccountLink.addEventListener('click', (e) => {
      e.preventDefault();
      container.classList.remove("right-panel-active");
    });

  }
  navigateToOrder() {
    this.scriptService.changePage('order');
  }

  changePage() {
    this.scriptService.changePage('resturant')
  }

}
