export class ChipAudio{
 ctx:AudioContext|null=null;timer:ReturnType<typeof setInterval>|null=null;enabled=true;step=0;mode="menu";
 async unlock(){if(!this.ctx)this.ctx=new AudioContext();await this.ctx.resume()}
 tone(hz:number,duration:number,type:OscillatorType="square",volume=.03,delay=0){if(!this.enabled||!this.ctx||this.ctx.state!=="running")return;const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=hz;g.gain.setValueAtTime(0,c.currentTime+delay);g.gain.linearRampToValueAtTime(volume,c.currentTime+delay+.005);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+delay+duration);o.connect(g);g.connect(c.destination);o.start(c.currentTime+delay);o.stop(c.currentTime+delay+duration+.02)}
 play(mode:string){if(this.timer)clearInterval(this.timer);this.mode=mode;this.step=0;if(mode==="paused")return;const menu=[64,67,71,76,74,71,67,62,64,67,72,71,67,64,62,59];const game=[76,0,79,76,81,79,76,74,72,76,79,83,81,79,76,74];const seq=mode==="game"?game:menu;this.timer=setInterval(()=>{const n=seq[this.step%seq.length];if(n)this.tone(440*2**((n-69)/12),.12,"square",.022);if(this.step%4===0)this.tone(440*2**(([40,45,48,43][Math.floor(this.step/8)%4]-69)/12),.22,"triangle",.07);if(this.step%2===0)this.tone(65,.035,"sawtooth",.025);this.step++},mode==="game"?135:195)}
 catch(){this.tone(880,.06);this.tone(1320,.09,"square",.035,.055)}
 miss(){this.tone(150,.2,"sawtooth",.04);this.tone(85,.25,"square",.025,.1)}
 stop(){if(this.timer)clearInterval(this.timer);this.timer=null}
}
