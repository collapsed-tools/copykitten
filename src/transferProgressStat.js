import EventEmitter from 'events';


export class TransferProgressStat {
  current = {
    fileNumber: 0,
    byte: 0,
  };
  total = {
    fileNumber: 0,
    byte: 0,
  };
  byteRate = {
    smooth: 0,
    smoother: 0,
    overall: 0,
  };
  eta = {
    smooth: null,
    smoother: null,
    overall: null,
  };
  innerTickDt = 1 / 50;
  innerTickTimer = null;

  previousByte = 0;
  previousT = 0;

  startTime = null;
  endTime = null;

  ee = new EventEmitter();
  reset(totalFileNumber, totalByte) {
    this.total.fileNumber = totalFileNumber;
    this.total.byte = totalByte;
    this.current.fileNumber = 0;
    this.current.byte = 0;
    this.current.fileName = null;
    this.previousByte = 0;
    this.previousT = 0;
    this.startTime = null;
    this.endTime = null;
    this.byteRate.smooth = 0;
    this.byteRate.smoother = 0;
    this.byteRate.overall = 0;
    this.eta.smooth = null;
    this.eta.smoother = null;
    this.eta.overall = null;
    this.ee.emit('reset');
  }

  start() {
    this.innerTickTimer = setInterval(() => this.innerTick(), this.innerTickDt * 1000);
    this.startTime = new Date();
    this.ee.emit('start');
  }

  update(fileName, bytes) {
    this.current.fileNumber++;
    this.current.byte += bytes;
    this.current.fileName = fileName;
    this.ee.emit('update');
  }

  end() {
    clearInterval(this.innerTickTimer);
    this.current.fileName = null;
    this.innerTickTimer = null;
    this.endTime = new Date();
    this.ee.emit('end');
  }

  innerTick() {
    const t = (new Date() - this.startTime) / 1000;
    const dt = t - this.previousT;
    const byteDiff = this.current.byte - this.previousByte;
    const byteRate = byteDiff / dt;

    this.byteRate.smooth = this.byteRate.smooth * 0.9 + byteRate * 0.1;
    this.byteRate.smoother = this.byteRate.smoother * 0.99 + byteRate * 0.01;
    this.byteRate.overall = this.current.byte / t;

    this.eta.smooth = this.total.byte / this.byteRate.smooth;
    this.eta.smoother = this.total.byte / this.byteRate.smoother;
    this.eta.overall = this.total.byte / this.byteRate.overall;

    this.previousByte = this.current.byte;
    this.previousT = t;
  }
}
