import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {MediaMatcher} from '@angular/cdk/layout';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  implements OnDestroy{
  title = 'Sparklingv2';
  mobileQuery: MediaQueryList;


  fillerContent = Array.from(
    {length: 8},
    (_, i) =>
      `Index: ${i}`,
  );

  private _mobileQueryListener: () => void;
  constructor(changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }
  ngOnDestroy(): void {

    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  // ngOnInit(): void {
    
  // }




}
