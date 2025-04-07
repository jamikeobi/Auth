import { CustomTimerPipe } from './custom-timer.pipe';

describe('CustomTimerPipe', () => {
  it('create an instance', () => {
    const pipe = new CustomTimerPipe();
    expect(pipe).toBeTruthy();
  });
});
