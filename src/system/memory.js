class Memory {
  constructor (size = '4K', updateDisplay = () => {}) {
    this.updateDisplay = updateDisplay

    let intSize = parseInt(size)

    if (isNaN(intSize)) {
      throw new Error(`Memory size must be an integer: ${size}`)
    }

    if (size.endsWith('K')) {
      intSize = intSize * 1024
    }

    if (intSize > (4 * 1024) || intSize < (256)) {
      throw new Error('Memory size must between 256 and 4K')
    }

    Object.defineProperties(this, {
      size: {
        value: intSize,
        writable: false
      },
      _mem: {
        value: new Uint8Array(intSize),
        writable: true
      }

    })
  }

  get memSize () {
    return `${this.size} Bytes`
  }

  readByte (address) {
    // Read a single byte from memory
    if (address > this.size - 1) {
      throw new Error(`Segmentation Fault - Invalid memory address: ${address}`)
    }
    return this._mem[address]
  }

  writeByte (address, value) {
    // Write a single byte to memory
    if (isNaN(value)) {
      throw new Error(`NaN - Value is not a number: ${value}`)
    }
    if (value < 0 || value > 255) {
      throw new Error(`Over/under flow - Value larger than byte: ${value}`)
    }
    if (address > this.size - 1) {
      throw new Error(`Segmentation Fault - Invalid memory address: ${address}`)
    }
    this._mem[address] = value
    this.updateDisplay(Array.from(this._mem), '#memory-display')
  }

  readBytes (address, num = 2) {
    // Read bytes (num) from memory
    let value = null
    for (const end = address + num; address < end; address++) {
      value = (value << 8) | this.readByte(address)
    }

    return value >>> 0
  }

  writeBytes (address, value, num = 2) {
    // Write bytes (num) to memory
    if (isNaN(value)) {
      throw new Error(`NaN - Value is not a number: ${value}`)
    }
    if (value < 0 || value > 0xFFFFFFFF || (value >>> ((num - 1) * 8)) > 255) {
      throw new Error(`Over/under flow - Value larger than ${num} bytes: ${value}`)
    }
    if (address + num > this.size - 1) {
      throw new Error(`Segmentation Fault - Invalid memory address: ${address + num}`)
    }
    for (let i = num - 1; i >= 0; i--) {
      const nthByte = ((value >> (i * 8)) & 0xFF) >>> 0
      this.writeByte(address, nthByte)
      address++
    }
    this.updateDisplay(Array.from(this._mem), '#memory-display')
  }

  reset () {
    // Reset memory
    console.log('Dump memory')
    this._mem.fill(0)
    this.updateDisplay(Array.from(this._mem), '#memory-display')
    return this._mem
  }
};

module.exports = Memory
