import { Injectable } from '@angular/core';
import { ScriptsService } from './scripts.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApexService {

  charts: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  constructor(private scriptService: ScriptsService) { }

  newChart(chartID:string, options:any) {
    let chart = new ApexCharts(document.querySelector(`#${chartID}`), options);
    this.charts.next(chart);
    return {
      chart,
      id: chartID
    };

  }
}
