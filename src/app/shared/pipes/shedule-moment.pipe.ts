import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sheduleMoment'
})
export class SheduleMomentPipe implements PipeTransform {

  transform(value: unknown, text:any): unknown {
    return this.expectedTo(text, value);
  }
  expectedTo(start:string, day:any){
    if(!day.status|| !day.checkIn || !day.checkOut){
      return '--';
    }
    const _start=parseInt(start.substring(0,2));
    const checkIn=parseInt(day.checkIn.substring(0,2));
    const checkOut=parseInt(day.checkOut.substring(0,2));
    if(_start==checkIn){
      return `Expected Check-In At ${day.checkIn}`;
    }else if(_start>checkIn && _start <checkOut){
      return `Expected At Work`;
    }else if(_start==checkOut){
      return `Expected Check-Out At ${day.checkOut}`;
    }else{
      return '--';
    }
  }
}
