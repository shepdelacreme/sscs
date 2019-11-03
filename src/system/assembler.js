const { opcodes } = require('./instructionset')
const debug = require('debug')('sscs:assembler')

const parseRegReg = (operands, name) => {
  const match = operands.match(/(r[0-7]),\s+(r[0-7])(,?)\s*(.*)/i)
  if (!match || match[3] !== '' || (match[4] !== '' && !match[4].startsWith('//'))) {
    throw new Error(`Illegal instruction operands: "${operands}" for ${name} instruction`)
  }
  return ((match[2][1] << 9) ^ (match[1][1] << 6))
}

const parseRegConstant = (operands, name) => {
  const match = operands.match(/(r[0-7]),\s+([0-9]+)(,?)\s*(.*)/i)
  if (!match || match[3] !== '' || (match[4] !== '' && !match[4].startsWith('//'))) {
    throw new Error(`Illegal instruction operands: "${operands}" for ${name} instruction`)
  }
  // Check size of immediate -> needs to fit in 7 bits
  if (parseInt(match[2]) > 127) {
    throw new Error(`Illegal instruction operand: "${match[2]}" immediate too large: must be < 128`)
  }
  return ((match[2] << 9) ^ (match[1][1] << 6))
}

const parseRegLabelImm = (operands, labels, name) => {
  const match = operands.match(/(r[0-7]),\s+(\w+)(,?)\s*(.*)/i)
  if (!match || match[3] !== '' || (match[4] !== '' && !match[4].startsWith('//'))) {
    throw new Error(`Illegal instruction operands: "${operands}" for ${name} instruction`)
  }
  const op2 = labelOrImmediate(match[2], labels)
  // Check size of immediate -> needs to fit in 7 bits
  if (parseInt(op2) > 127) {
    throw new Error(`Illegal instruction operand: "${op2}" immediate too large: must be < 128`)
  }
  return ((op2 << 9) ^ (match[1][1] << 6))
}

const parseSingleReg = (operands, name) => {
  const match = operands.match(/(r[0-7])(,?)\s*(.*)/i)
  if (!match || match[2] !== '' || (match[3] !== '' && !match[3].startsWith('//'))) {
    throw new Error(`Illegal instruction operands: "${operands}" for ${name} instruction`)
  }
  return (match[1][1] << 6)
}

const parseLabelImm = (operands, labels, name) => {
  const match = operands.match(/([0-9]+|\w+)(,?)\s*(.*)/i)
  if (!match || match[2] !== '' || (match[3] !== '' && !match[3].startsWith('//'))) {
    throw new Error(`Illegal instruction operands: "${operands}" for ${name} instruction`)
  }
  const op = labelOrImmediate(match[1], labels)
  if (isNaN(parseInt(op))) {
    // handle label
  } else if (parseInt(op) > 1023) {
    throw new Error(`Illegal instruction operand: "${match[1]}" immediate too large: must be < 1024`)
  }
  return (op << 6)
}

const labelOrImmediate = (op, labels) => {
  const labelMatch = labels.filter((label) => {
    if (op === label[0]) {
      return label
    }
  })

  if (labelMatch.length !== 0) {
    return labelMatch[0][1]
  }

  return op
}

const parse = {
  HLT: () => { return 0 },
  HCF: () => { return 0 },
  ADD: (operands) => {
    // Format: ADD r0, r1
    return parseRegReg(operands, 'ADD')
  },
  ADDI: (operands) => {
    // Format: ADDI r0, 15
    return parseRegConstant(operands, 'ADDI')
  },
  SUB: (operands) => {
    // Format: SUB r0, r1
    return parseRegReg(operands, 'SUB')
  },
  SUBI: (operands) => {
    // Format: SUBI r0, 15
    return parseRegConstant(operands, 'SUBI')
  },
  MUL: (operands) => {
    // Format: MUL r0, r1
    return parseRegReg(operands, 'MUL')
  },
  MULI: (operands) => {
    // Format: MULI r0, 15
    return parseRegConstant(operands, 'MULI')
  },
  DIV: (operands) => {
    // Format: DIV r0, r1
    return parseRegReg(operands, 'DIV')
  },
  DIVI: (operands) => {
    // Format: DIVI r0, 15
    return parseRegConstant(operands, 'DIVI')
  },
  MOD: (operands) => {
    // Format: MOD r0, r1
    return parseRegReg(operands, 'MOD')
  },
  MODI: (operands) => {
    // Format: MODI r0, 15
    return parseRegConstant(operands, 'MODI')
  },
  AND: (operands) => {
    // Format: AND r0, r1
    return parseRegReg(operands, 'AND')
  },
  ANDI: (operands) => {
    // Format: ANDI r0, 15
    return parseRegConstant(operands, 'ANDI')
  },
  OR: (operands) => {
    // Format: OR r0, r1
    return parseRegReg(operands, 'OR')
  },
  ORI: (operands) => {
    // Format: ORI r0, 15
    return parseRegConstant(operands, 'ORI')
  },
  XOR: (operands) => {
    // Format: XOR r0, r1
    return parseRegReg(operands, 'XOR')
  },
  XORI: (operands) => {
    // Format: XORI r0, 15
    return parseRegConstant(operands, 'XORI')
  },
  NOT: (operands) => {
    // Format: NOT r0
    return parseSingleReg(operands, 'NOT')
  },
  SL: (operands) => {
    // Format: SL r0, r1
    return parseRegReg(operands, 'SL')
  },
  SLI: (operands) => {
    // Format: SLI r0, 15
    return parseRegConstant(operands, 'SLI')
  },
  SR: (operands) => {
    // Format: SR r0, r1
    return parseRegReg(operands, 'SR')
  },
  SRI: (operands) => {
    // Format: SRI r0, 15
    return parseRegConstant(operands, 'SRI')
  },
  TEQ: (operands) => {
    // Format: TEQ r0, r1
    return parseRegReg(operands, 'TEQ')
  },
  TLT: (operands) => {
    // Format: TLT r0, r1
    return parseRegReg(operands, 'TLT')
  },
  TGT: (operands) => {
    // Format: TGT r0, r1
    return parseRegReg(operands, 'TGT')
  },
  B: (operands, labels) => {
    // Format: B ## or label
    return parseLabelImm(operands, labels, 'B')
  },
  BAL: (operands, labels) => {
    // Format: BAL ## or label
    return parseLabelImm(operands, labels, 'BAL')
  },
  BR: (operands, labels) => {
    // Format: BR reg
    return parseSingleReg(operands, labels, 'BR')
  },
  BEQZ: (operands, labels) => {
    // Format: BEQZ ## or label
    return parseLabelImm(operands, labels, 'BEQZ')
  },
  BNEZ: (operands, labels) => {
    // Format: BNEZ ## or label
    return parseLabelImm(operands, labels, 'BNEZ')
  },
  LD: (operands) => {
    // Format: LD r0, r1
    return parseRegReg(operands, 'LD')
  },
  LDL: (operands, labels) => {
    // Format: LDL ## or label
    return parseLabelImm(operands, labels, 'LDL')
  },
  ST: (operands) => {
    // Format: ST r0, r1
    return parseRegReg(operands, 'ST')
  },
  STL: (operands, labels) => {
    // Format: STL ## or label
    return parseLabelImm(operands, labels, 'STL')
  },
  CPY: (operands) => {
    // Format: CPY r0, r1
    return parseRegReg(operands, 'CPY')
  },
  CPYM: (operands, labels) => {
    // Format: CPYM r0, ## or label
    return parseRegLabelImm(operands, labels, 'CPYM')
  },
  PSH: (operands) => {
    // Format: PSH r0
    return parseSingleReg(operands, 'PSH')
  },
  PSHM: (operands, labels) => {
    // Format: PSHM ##
    return parseLabelImm(operands, labels, 'PSHM')
  },
  POP: (operands) => {
    // Format: POP r0
    return parseSingleReg(operands, 'POP')
  },
  POPM: (operands, labels) => {
    // Format: POPM ##
    return parseLabelImm(operands, labels, 'POPM')
  },
  RET: () => { return 0 },
  PRN: (operands, labels) => {
    return parseLabelImm(operands, labels, 'PRN')
  },
  NOP: () => { return 0 }
}

const assemble = (input, cpu) => {
  const labels = []
  const instructions = []
  const inputLines = input.split('\n').filter((el) => {
    if (el != null || (el.length > 0 && !el.startsWith('//'))) {
      return el.trim()
    }
  })
  // Probably a better way to do this but we have to scan for definitions
  // first prior to labels and lastly instructions so three passes it is
  // Definition/variable pass we load these at the beginning of memory in
  // sequential order
  let memMarker = 0
  inputLines.forEach(line => {
    if (!line.match(/^def:/i)) {
      // not a def line so we skip
      return
    }
    const match = line.match(/def:\s+(\w+)\s+(.+)/i)
    if (!match) {
      throw new Error(`Illegal DEF statement: "${line}"`)
    }
    debug(`name: ${match[1]}`)
    // Test and parse def value for number, array, or char/string
    const int = parseInt(match[2])
    if (!isNaN(int)) {
      debug(`parse val as int: ${match[2]}`)
      // parse int
      if (int > 65535) {
        throw new Error(`Integer value too big: ${match[2]} > 65535`)
      }
      labels.push([match[1], memMarker])
      // write to mem
      cpu.mem.writeBytes(memMarker, int)
      memMarker += 2
    } else if (match[2].startsWith('"') || match[2].startsWith("'")) {
      debug(`parse val as string: ${match[2]}`)
      // parse string/char
      if (!match[2].endsWith(match[2][0])) {
        // unbalanced string/char delimiter
        throw new Error(`Illegal string/char value: "${match[2]}"`)
      }
      // string leading/trailing quotes
      labels.push([match[1], memMarker])
      // convert to ascci codes
      const asciiArray = [...match[2]].map(char => char.charCodeAt(0))
      // remove the trailing and leading quotes
      asciiArray.shift()
      asciiArray.pop()
      // add null terminator to end
      asciiArray.push(0)
      // write to mem
      asciiArray.forEach(el => {
        cpu.mem.writeByte(memMarker, el)
        memMarker += 1
      })
    } else if (match[2].startsWith('[')) {
      debug(`parse val as array: ${match[2]}`)
      // parse array of values
      if (!match[2].endsWith(']')) {
        // unbalanced array delimiter
        throw new Error(`Unbalanced array delimiter: "${match[2]}"`)
      }
      labels.push([match[1], memMarker])
      // write to mem
      const parsedArray = JSON.parse(match[2])
      parsedArray.forEach(el => {
        const elInt = parseInt(el)
        if (isNaN(elInt)) {
          throw new Error(`Illegal array value must be int: "${el}"`)
        }
        if (elInt > 65535) {
          throw new Error(`Integer value too big: ${match[2]} > 65535`)
        }
        cpu.mem.writeBytes(memMarker, elInt)
        memMarker += 2
      })
    } else {
      debug(`unknown value type: ${match[2]}`)
      throw new Error(`Illegal definition statement value: "${match[2]}"`)
    }
  })

  // move pc to memMarker
  cpu._r.pc = memMarker

  // Label pass we parse these after definitions but before instructions.
  // Labels get combined with data names are are replaced with physical
  // addresses in instructions
  let labelMarker = memMarker
  inputLines.forEach((line) => {
    if (line.match(/^def:/i)) {
      // def line so we skip
      return
    }

    if (line.startsWith('.')) {
      // process as a label line
      const match = line.match(/\.(\w+):\s*(.*)/i)
      debug(match)
      if (!match) {
        throw new Error(`Illegal statement: "${line}"`)
      }
      labels.push([match[1], labelMarker])
      // check if there is an instruction following the label and add a NOP
      console.log(match[2])
      const labelInstr = match[2]
      if (labelInstr === '' || labelInstr.startsWith('//')) {
        const encodedInstr = parseInstruction('NOP')
        cpu.mem.writeBytes(labelMarker, encodedInstr)
      }
    }

    // increment our mem location for all lines not just labels
    // this is so we keep track of instructions as well
    labelMarker += 2
  })

  inputLines.forEach(line => {
    if (line.match(/^def:/i)) {
      // def so we skip
      return
    }

    let instr = line
    if (instr.startsWith('.')) {
      // process as a label line
      const match = instr.match(/\.(\w+):\s*(.*)/i)
      instr = match[2]
      // check if there is an instruction following the label and add a NOP
      if (instr === '' || instr.startsWith('//')) {
        instr = 'NOP'
      }
    }

    const encodedInstr = parseInstruction(instr, labels)
    instructions.push(encodedInstr)
    cpu.mem.writeBytes(memMarker, encodedInstr)
    memMarker += 2
  })
  return [labels, instructions]
}

const parseInstruction = (input, labels) => {
  const [, instr, operands] = input.match(/([a-z0-9]+)\s*(.*)/i)
  const opcode = opcodes[instr]
  if (opcode === undefined) {
    throw new Error(`Undefined opcode for instruction: ${instr}`)
  }
  return parse[instr](operands, labels) ^ opcode
}

module.exports = assemble
