import { Component, OnInit, Input } from '@angular/core';
import { ScriptsService } from '../../services/client/scripts.service';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss']
})
export class AccessDeniedComponent implements OnInit {
  @Input('link') link:string = '/';
  @Input('btntext') btntext:string = 'Back To Safety';
  @Input('message') message:string = 'You dont have permission to view this site';
  constructor(private scriptService:ScriptsService) { }

  ngOnInit(): void {
  }
  navigate(){
    this.scriptService.changePage(this.link)
  }

}
