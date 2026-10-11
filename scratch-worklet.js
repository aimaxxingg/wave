// Scratching the record on the turntable (crate.js): plays the decoded song from where the needle is, at whatever
// speed and direction the hand moves the record (rate 1 = normal play, 0 = held still, below 0 = backwards).
class Scratch extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'rate', defaultValue: 0, minValue: -16, maxValue: 16, automationRate: 'k-rate' }]
  }

  constructor() {
    super()
    this.ch = null
    this.pos = 0
    this.on = false
    this.port.onmessage = ({ data }) => {
      if (data.buf) this.ch = data.buf
      if (data.start != null) {
        this.pos = data.start * sampleRate
        this.on = true
      }
      if (data.stop) this.on = false
      if (data.ask || data.stop) this.port.postMessage({ pos: this.pos / sampleRate })
    }
  }

  process(_, outputs, params) {
    const out = outputs[0]
    if (!this.on || !this.ch || !out.length) return true
    const rate = params.rate[0]
    const len = this.ch[0].length
    for (let i = 0; i < out[0].length; i++) {
      const i0 = Math.floor(this.pos)
      const f = this.pos - i0
      const inside = i0 >= 0 && i0 < len - 1
      for (let c = 0; c < out.length; c++) {
        const d = this.ch[Math.min(c, this.ch.length - 1)]
        out[c][i] = inside ? d[i0] + (d[i0 + 1] - d[i0]) * f : 0
      }
      this.pos = Math.max(0, Math.min(len - 1, this.pos + rate))
    }
    return true
  }
}

registerProcessor('scratch', Scratch)
