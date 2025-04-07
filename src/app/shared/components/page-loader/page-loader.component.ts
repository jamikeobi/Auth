import { Component, OnInit } from '@angular/core';
import { ScriptsService } from '../../services/client/scripts.service';
import { DeviceService } from '../../services/client/device.service';
declare const $:any
@Component({
  selector: 'app-page-loader',
  templateUrl: './page-loader.component.html',
  styleUrls: ['./page-loader.component.scss']
})
export class PageLoaderComponent implements OnInit {
  width = 100;
  perfData = window.performance.timing;// The PerformanceTiming interface represents timing-related performance information for the given page.
  EstimatedTime = -(this.perfData.loadEventEnd - this.perfData.navigationStart);
  time = ((this.EstimatedTime / 1000) % 60) * 100;

  // Percentage Increment Animation
  PercentageID = $("#percent1");
  start = 0;
  end = 100;
  durataion = this.time;


  constructor(private script: ScriptsService, private _device: DeviceService) { }

  ngOnInit(): void {
    this.animateValue(this.PercentageID, this.start, this.end, this.durataion);
    // this._device.showPageLoader.next(this.durataion);
    // this._device.showPageLoader.subscribe(
    //   duration=>{
    //     this.durataion = duration;
    //     this.time = this.durataion;
    //
    //     if(this.durataion > 0){
      // this.animateValue(this.PercentageID, this.start, this.end, this.durataion);
    //     }
    //   }
    // )

  }

  animateValue(id: any, start: any, end: any, duration: any) {

    var range = end - start,
      current = start,
      increment = end > start ? 1 : -1,
      stepTime = Math.abs(Math.floor(duration / range)),
      obj = $(id);

    var timer = setInterval(function () {
      current += increment;
      $(obj).text(current + "%");
      $("#bar1").css('width', current + "%");
      //obj.innerHTML = current;
      if (current == end) {
        clearInterval(timer);
      }
    }, stepTime);
    // Fading Out Loadbar on Finised
    setTimeout( () => {
      $('.pre-loader').fadeOut(300);
      this._device.showPageLoader.next(0);
    }, this.time);
  }
}
