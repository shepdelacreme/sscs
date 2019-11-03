const Tonic = require('@optoolco/tonic')
// const { qs } = require('qs')

class RegisterDisplay extends Tonic {
  willConnect () {
    this.setState({
      registers: this.props.value
    })
  }

  get value () {

  }

  set value (value) {
    this.state.registers = value
    this.reRender()
  }

  renderValue () {
    let registers = ''
    for (const [key, val] of Object.entries(this.state.registers)) {
      registers += `
        <div class="register-name">${key.toUpperCase().padEnd(4, ' ')}:</div>
        <div class="register-content">${val}</div>
        <div class="separator"></div>
      `
    }
    return registers
  }

  render () {
    return this.html`
      <div class="tonic--wrapper">
        <label>Registers</label>
        <div class="tonic--register-display-content">
          <div class="registers">
            ${this.renderValue()}
          </div>
        </div>
      </div>
    `
  }
}

Tonic.add(RegisterDisplay)
