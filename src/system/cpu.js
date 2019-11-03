const { instrMap } = require('./instructionset')

const getPaddedBinary = (val, length) => {
  return val.toString(2).padStart(length, '0')
}

class Registers {
  constructor (registers) {
    const {
      reg0 = 0,
      reg1 = 0,
      reg2 = 0,
      reg3 = 0,
      reg4 = 0,
      reg5 = 0,
      reg6 = 0,
      reg7 = 0,
      sp = 0,
      ra = 0,
      pc = 0
    } = { ...registers }

    this.reg0 = reg0
    this.reg1 = reg1
    this.reg2 = reg2
    this.reg3 = reg3
    this.reg4 = reg4
    this.reg5 = reg5
    this.reg6 = reg6
    this.reg7 = reg7
    this.sp = sp
    this.ra = ra
    this.pc = pc
  }

  regmap (num) {
    const m = ['reg0', 'reg1', 'reg2', 'reg3', 'reg4', 'reg5', 'reg6', 'reg7', 'sp', 'ra', 'pc']
    return m[num]
  }

  read (num) {
    const k = this.regmap(num)
    return this[k]
  }

  write (num, value) {
    const k = this.regmap(num)
    this[k] = value
  }
}

class CPU {
  constructor (
    memory,
    registers,
    updateDisplay = () => {},
    sendToElement = () => {},
    resetButtons = () => {},
    burn = () => {}
  ) {
    this._r = new Registers(registers)

    this.updateDisplay = updateDisplay
    this.sendToElement = sendToElement
    this.resetButtons = resetButtons

    Object.defineProperties(this, {
      instr: {
        value: instrMap,
        writable: false
      },
      version: {
        value: '0.0.1',
        writable: false
      },
      mem: {
        value: memory,
        writable: false
      },
      cur_ins: {
        value: null,
        writable: true
      },
      interrupt: {
        value: false,
        writable: true
      },
      messages: {
        value: [
          'Initializing CPU'
        ],
        writable: true
      }
    })

    this.messages.push(
      `ISA Version: ${this.version}`,
      `Main Memory Connected: ${this.mem.memSize}`,
      `Current State: ${JSON.stringify(this.state)}`
    )
  }

  step () {
    // fetch instruction
    const ins = this.fetch()
    // decode instruction
    const [opcode, operands] = this.decode(ins)
    console.log(`opcode: ${opcode}, operands: ${operands}`)
    // execute instruction
    try {
      const instrFunc = this.instr[opcode]
      if (instrFunc !== undefined) {
        instrFunc(this, operands)
      } else {
        throw new Error(`Undefined opcode: ${opcode}`)
      }
    } catch (err) {
      this.sendToElement(`Fault in execution: ${err}`, '#console-window')
      this.sendInterrupt()
    }
    this.updateDisplay(this._r, '#register-display')
  }

  fetch () {
    const ins = this.mem.readBytes(this._r.pc, 2)
    this.sendToElement(`Fetched Instruction at mem location ${this._r.pc}: ${getPaddedBinary(ins, 16)}`, '#console-window')
    // increment pc to next instruction
    this._r.pc += 2
    return ins
  }

  decode (instruction) {
    const opcode = instruction & 0x3f
    const operand1 = (instruction >>> 6) & 0x07
    const operand2 = (instruction >>> 9) & 0x07
    const operand3 = (instruction >>> 12) & 0x0f
    this.sendToElement(`opcode: ${opcode}`, '#console-window')
    return [opcode, [operand1, operand2, operand3]]
  }

  run () {
    this.cur_ins = setTimeout(() => {
      this.step()
      if (!this.interrupt) {
        this.run()
      }
    }, 500)
  }

  get state () {
    return this._r
  }

  set state (newState) {
    this._r = new Registers(newState)
  }

  sendInterrupt () {
    this.interrupt = true
    clearTimeout(this.cur_ins)
    this.resetButtons()
  }

  clearInterrupt () {
    this.interrupt = false
  }

  reset () {
    // Reset CPU State
    this.sendInterrupt()
    this.state = new Registers()
    this.interrupt = false
    this.cur_ins = null
    this.messages = [
      'CPU and Memory Reset',
      'Initializing CPU',
      `ISA Version: ${this.version}`,
      `Main Memory Connected: ${this.mem.memSize}`,
      `Current State: ${JSON.stringify(this.state)}`
    ]
    this.updateDisplay(this._r, '#register-display')
    return this.state
  }
};

module.exports = CPU
