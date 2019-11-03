const MAX_REG_SIZE = 65535

const opcodes = {
  HLT: 0, //   HLT              Halt the CPU
  HCF: 1, //   HCF              Unknown/experimental

  ADD: 2, //   ADD r1, r2       Add two registers and store result
  ADDI: 3, //  ADDI r1, 127     Add constant to reg value
  SUB: 4, //   SUB r1, r2       Subtract two registers and store result
  SUBI: 5, //  SUBI r1, 127     Subtract constant from reg value
  MUL: 6, //   MUL r1, r2       Multiply two registers and store result
  MULI: 7, //  MULI r1, 127     Multiply constant with reg value
  DIV: 8, //   DIV r1, r2       Divide two registers and store result
  DIVI: 9, //  DIVI r1, 127     Divide reg by constant value
  MOD: 10, //  MOD r1, r2       Get remainder (r2 % r3) of two registers and store result
  MODI: 11, // MODI r1, 127     Get remainder of constant and reg value (r1 = r1 % 127)

  AND: 15, //  AND r1, r2       Bitwise AND two values and place result in r0
  ANDI: 16, // ANDI r1, 127     Bitwise AND two values and place result in r0
  OR: 17, //   OR r1, r2        Bitwise OR two values and place result in r0
  ORI: 18, //  ORI r1, 127      Bitwise OR two values and place result in r0
  XOR: 19, //  XOR r1, r2       Bitwise Exclusive OR two values and place result in r0
  XORI: 20, // XORI r1, 127     Bitwise Exclusive OR two values and place result in r0
  NOT: 23, //  NOT r1           Perform logical not on value

  SL: 24, //   SL r1, r2        Shift r1 left by r2 value and store in r0 simple op r1 >>> 15
  SLI: 25, //  SLI r1, 15       Shift r1 left by immediate value and store in r0 (r1 << 15) & 0xffff
  SR: 26, //   SR r1, r2        Shift r1 right by r2 and store in r0 simple op r1 >>> 15
  SRI: 27, //  SRI r1, 15       Shift r1 right by immediate value and store in r0 (r1 << 15) & 0xffff
  TEQ: 30, //  TEQ r1, r2       Test r1 == r2 and set r7 with 0 | 1 result
  TLT: 31, //  TLT r1, r2       Test r1 < r2 and set r7 with 0 | 1 result
  TGT: 33, //  TGT r1, r2       Test r1 > r2 and set r7 with 0 | 1 result

  B: 40, //    B label          Unconditional branch/jump to label address
  BAL: 41, //  B label          Unconditional branch/jump and store next instruction address in ra
  BR: 42, //   B r1             Unconditional branch to address in register
  BEQZ: 43, // B label          Conditional branch to label address if value in r7 is zero
  BNEZ: 44, // B label          Conditional branch to label address if value in r7 is not zero

  LD: 50, //   LD r1, r2        Load item from mem address in r2 and store into r1
  LDL: 51, //  LDL ## or label  Load mem address into r0
  ST: 52, //   ST r1, r2        Store value in r2 at mem address in r1
  STL: 53, //  STL ## or label  Store value in r0 at literal mem address

  CPY: 55, //  COPY r0, r2      Copy r2 value to r0
  CPYM: 56, // CPYM r0, ##      Copy value from literal mem address or label and store into r0

  PSH: 57, //  PSH r1           Push item from reg onto stack
  PSHM: 58, // PSHM ##          Push item from literal mem address onto stack
  POP: 59, //  POP r1           Pop item from stack and store in r1
  POPM: 60, // POPM ##          Pop item from stack and store to literal mem address

  RET: 61, //  RET              Unconditional branch to address in ra register
  PRN: 62, //  PRN label        Print string that starts at label or literal address until NULL terminator found
  NOP: 63 //   NOP              Do nothing
}

const getImmediate = (upper, lower, middle) => {
  if (middle === undefined) {
    return upper << 3 ^ lower
  }
  return (upper << 6) ^ (middle << 3) ^ lower
}

const instructions = {
  HLT: (cpu) => {
    cpu.sendToElement('Executing Halt', '#console-window')
    cpu.sendInterrupt()
  },
  HCF: (cpu) => {
    cpu.sendToElement('Executing HCF!!', '#console-window')
    cpu.sendInterrupt()
    cpu.burn()
  },
  ADD: (cpu, operands) => {
    cpu.sendToElement('Executing Add', '#console-window')
    const result = cpu._r.read(operands[0]) + cpu._r.read(operands[1])
    if (result > MAX_REG_SIZE) {
      throw new Error('Operation overflowed max register size')
    }
    cpu._r.write(0, result)
  },
  ADDI: (cpu, operands) => {
    cpu.sendToElement('Executing Add immediate', '#console-window')
    const result = cpu._r.read(operands[0]) + getImmediate(operands[2], operands[1])
    if (result > MAX_REG_SIZE) {
      throw new Error('Operation overflowed max register size')
    }
    cpu._r.write(0, result)
  },
  SUB: (cpu, operands) => {
    cpu.sendToElement('Executing Subtract', '#console-window')
    const result = cpu._r.read(operands[0]) - cpu._r.read(operands[1])
    if (result < 0) {
      cpu.sendToElement('Subtraction underflow - storing 0', '#console-window')
      cpu._r.write(0, 0)
      return
    }
    cpu._r.write(operands[0], result)
  },
  SUBI: (cpu, operands) => {
    cpu.sendToElement('Executing Subtract immediate', '#console-window')
    const result = cpu._r.read(operands[0]) - getImmediate(operands[2], operands[1])
    if (result < 0) {
      cpu.sendToElement('Subtraction underflow - storing 0', '#console-window')
      cpu._r.write(0, 0)
      return
    }
    cpu._r.write(0, result)
  },
  MUL: (cpu, operands) => {
    cpu.sendToElement('Executing Multiply', '#console-window')
    const result = cpu._r.read(operands[0]) * cpu._r.read(operands[1])
    if (result > MAX_REG_SIZE) {
      throw new Error('Operation overflowed max register size')
    }
    cpu._r.write(0, result)
  },
  MULI: (cpu, operands) => {
    cpu.sendToElement('Executing Multiply immediate', '#console-window')
    const result = cpu._r.read(operands[0]) * getImmediate(operands[2], operands[1])
    if (result > MAX_REG_SIZE) {
      throw new Error('Operation overflowed max register size')
    }
    cpu._r.write(0, result)
  },
  DIV: (cpu, operands) => {
    cpu.sendToElement('Executing Multiply', '#console-window')
    const divisor = cpu._r.read(operands[1])
    if (divisor === 0) {
      cpu.sendToElement('Illegal divide by zero. Halting', '#output-window')
      cpu.sendInterrupt()
    }
    const dividend = cpu._r.read(operands[0])
    const result = dividend / divisor
    cpu._r.write(0, result)
  },
  DIVI: (cpu, operands) => {
    cpu.sendToElement('Executing Multiply immediate', '#console-window')
    const divisor = getImmediate(operands[2], operands[1])
    if (divisor === 0) {
      cpu.sendToElement('Illegal divide by zero. Halting', '#output-window')
      cpu.sendInterrupt()
    }
    const dividend = cpu._r.read(operands[0])
    const result = dividend / divisor
    cpu._r.write(0, result)
  },
  MOD: (cpu, operands) => {
    cpu.sendToElement('Executing Modulus', '#console-window')
    const result = cpu._r.read(operands[0]) % cpu._r.read(operands[1])
    cpu._r.write(0, result)
  },
  MODI: (cpu, operands) => {
    cpu.sendToElement('Executing Modulus immediate', '#console-window')
    const result = cpu._r.read(operands[0]) % getImmediate(operands[2], operands[1])
    cpu._r.write(0, result)
  },
  AND: (cpu, operands) => {
    cpu.sendToElement('Executing Bitwise AND', '#console-window')
    const result = cpu._r.read(operands[0]) & cpu._r.read(operands[1])
    cpu._r.write(0, result)
  },
  ANDI: (cpu, operands) => {
    cpu.sendToElement('Executing Bitwise AND immediate', '#console-window')
    const result = cpu._r.read(operands[0]) & getImmediate(operands[2], operands[1])
    cpu._r.write(0, result)
  },
  OR: (cpu, operands) => {
    cpu.sendToElement('Executing Bitwise OR', '#console-window')
    const result = cpu._r.read(operands[0]) | cpu._r.read(operands[1])
    cpu._r.write(0, result)
  },
  ORI: (cpu, operands) => {
    cpu.sendToElement('Executing Bitwise OR immediate', '#console-window')
    const result = cpu._r.read(operands[0]) | getImmediate(operands[2], operands[1])
    cpu._r.write(0, result)
  },
  XOR: (cpu, operands) => {
    cpu.sendToElement('Executing Bitwise Exclusive OR', '#console-window')
    const result = cpu._r.read(operands[0]) ^ cpu._r.read(operands[1])
    cpu._r.write(0, result)
  },
  XORI: (cpu, operands) => {
    cpu.sendToElement('Executing Bitwise Exclusive OR immediate', '#console-window')
    const result = cpu._r.read(operands[0]) ^ getImmediate(operands[2], operands[1])
    cpu._r.write(0, result)
  },
  NOT: (cpu, operands) => {
    cpu.sendToElement('Executing Negation', '#console-window')
    // Have to negate manually because the JS bitwise operators are signed
    const result = parseInt(Array.from(cpu._r.read(operands[0]).toString(2)).map((i) => {
      if (i === '0') return 1
      if (i === '1') return 0
    }).join(''), 2)
    cpu._r.write(0, result)
  },
  SL: (cpu, operands) => {
    cpu.sendToElement('Executing Shift Left', '#console-window')
    const result = (cpu._r.read(operands[0]) << cpu._r.read(operands[1])) & 0xFFFF
    cpu._r.write(0, result)
  },
  SLI: (cpu, operands) => {
    cpu.sendToElement('Executing Shift Left immediate', '#console-window')
    const result = (cpu._r.read(operands[0]) << getImmediate(operands[2], operands[1])) & 0xFFFF
    cpu._r.write(0, result)
  },
  SR: (cpu, operands) => {
    cpu.sendToElement('Executing Shift Right', '#console-window')
    const shiftamt = cpu._r.read(operands[1])
    let result = cpu._r.read(operands[0]) >>> shiftamt
    if (shiftamt >= 16) {
      result = 0
    }
    cpu._r.write(0, result)
  },
  SRI: (cpu, operands) => {
    cpu.sendToElement('Executing Shift Right immediate', '#console-window')
    const shiftamt = getImmediate(operands[2], operands[1])
    let result = cpu._r.read(operands[0]) >>> shiftamt
    if (shiftamt >= 16) {
      result = 0
    }
    cpu._r.write(0, result)
  },
  TEQ: (cpu, operands) => {
    cpu.sendToElement('Executing Test if equal', '#console-window')
    cpu._r.write(7, cpu._r.read(operands[0]) === cpu._r.read(operands[1]))
  },
  TLT: (cpu, operands) => {
    cpu.sendToElement('Executing Test if less than', '#console-window')
    cpu._r.write(7, cpu._r.read(operands[0]) < cpu._r.read(operands[1]))
  },
  TGT: (cpu, operands) => {
    cpu.sendToElement('Executing Test if greater than', '#console-window')
    cpu._r.write(7, cpu._r.read(operands[0]) > cpu._r.read(operands[1]))
  },
  B: (cpu, operands) => {
    cpu.sendToElement('Executing Branch', '#console-window')
    const address = getImmediate(operands[2], operands[0], operands[1])
    cpu._r.pc = address
  },
  BAL: (cpu, operands) => {
    cpu.sendToElement('Executing Branch and link', '#console-window')
    const address = getImmediate(operands[2], operands[0], operands[1])
    cpu._r.ra = cpu._r.pc
    cpu._r.pc = address
  },
  BR: (cpu, operands) => {
    cpu.sendToElement('Executing Branch to address in register', '#console-window')
    const address = cpu._r.read(operands[0])
    cpu._r.pc = address
  },
  BEQZ: (cpu, operands) => {
    cpu.sendToElement('Executing Branch if condition equals zero', '#console-window')
    const address = getImmediate(operands[2], operands[0], operands[1])
    if (cpu._r.read(7) === 0) {
      cpu._r.pc = address
    }
  },
  BNEZ: (cpu, operands) => {
    cpu.sendToElement('Executing Branch if condition not equal zero', '#console-window')
    const address = getImmediate(operands[2], operands[0], operands[1])
    if (cpu._r.read(7) !== 0) {
      cpu._r.pc = address
    }
  },
  LD: (cpu, operands) => {
    cpu.sendToElement('Executing Load', '#console-window')
    const address = cpu._r.read(operands[1])
    const value = cpu.mem.readBytes(address)
    cpu._r.write(operands[0], value)
  },
  LDL: (cpu, operands) => {
    cpu.sendToElement('Executing Load address reference', '#console-window')
    const address = getImmediate(operands[2], operands[0], operands[1])
    cpu._r.write(0, address)
  },
  ST: (cpu, operands) => {
    cpu.sendToElement('Executing Store', '#console-window')
    const address = cpu._r.read(operands[0])
    const value = cpu._r.read(operands[1])
    cpu.mem.writeBytes(address, value)
  },
  STL: (cpu, operands) => {
    cpu.sendToElement('Executing Store direct address', '#console-window')
    const address = getImmediate(operands[2], operands[0], operands[1])
    const value = cpu._r.read(0)
    cpu.mem.writeBytes(address, value)
  },
  CPY: (cpu, operands) => {
    cpu.sendToElement('Executing Copy registers', '#console-window')
    cpu._r.write(operands[0], cpu._r.read(operands[1]))
  },
  CPYM: (cpu, operands) => {
    cpu.sendToElement('Executing Copy mem to reg', '#console-window')
    const imm = getImmediate(operands[2], operands[1])
    const value = cpu.mem.readBytes(imm)
    cpu._r.write(operands[0], value)
  },

  // TODO: PSH
  // TODO: PSHM
  // TODO: POP
  // TODO: POPM

  RET: (cpu) => {
    cpu.sendToElement('Executing Return to ra address', '#console-window')
    cpu._r.pc = cpu._r.ra
  },
  PRN: (cpu, operands) => {
    cpu.sendToElement('Executing Print to Output', '#console-window')
    let imm = getImmediate(operands[2], operands[0], operands[1])
    let output = ''
    let char = String.fromCharCode(cpu.mem.readByte(imm))
    do {
      char = String.fromCharCode(cpu.mem.readByte(imm))
      output += char
      imm++
    } while (char.charCodeAt(0))
    console.log(output)
    cpu.sendToElement(output, '#output-window')
  },
  NOP: (cpu) => {
    cpu.sendToElement('Executing No-op', '#console-window')
  }
}

const instrMap = []

Object.entries(instructions).forEach(
  ([name, func]) => {
    instrMap[opcodes[name]] = func
  }
)

module.exports = {
  instructions,
  opcodes,
  instrMap
}
