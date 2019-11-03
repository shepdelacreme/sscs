const Tonic = require('@optoolco/tonic')
const components = require('@optoolco/components')
const debug = require('debug')('sscs:app')
const { qs } = require('qs')
const CPU = require('./system/cpu')
const Memory = require('./system/memory')
const assemble = require('./system/assembler')

window.localStorage.debug = 'sscs:*'

const example = [
  'DEF: spacer 1',
  'DEF: arr [1,2,3,4,5]',
  'DEF: sz 5',
  '',
  'CPYM r7, sz',
  'LDL arr',
  'CPY r5, r0',
  'B loop',
  '',
  '.loop: BEQZ exit',
  'LD r2, r5',
  'SUBI r7, 1',
  'CPY r7, r0',
  'ADDI r5, 2',
  'CPY r5, r0',
  'ADD r2, r4',
  'CPY r4, r0',
  'B loop',
  '',
  '.exit: HLT'
]
components(Tonic, process.nonce)

require('./components/code-editor')
require('./components/console-output')
require('./components/register-display')
require('./components/memory-display')

const updateDisplay = (value, selector) => {
  qs(selector).value = value
}

const sendToElement = (message, selector) => {
  const el = qs(selector)
  el.value = el.value + `\n${message}`
  const ta = qs('textarea', el)
  ta.scrollTop = ta.scrollHeight
}

const resetButtons = () => {
  qs('#tonic-button-runhalt button').textContent = 'Run'
  const stepButton = qs('#tonic-button-step')
  stepButton.reRender({ ...stepButton.props, disabled: false })
  const assembleButton = qs('#tonic-button-assemble')
  assembleButton.reRender({ ...assembleButton.props, disabled: false })
  qs('app-container').setState(state => ({
    ...state,
    isRunning: false
  }))
}

class AppContainer extends Tonic {
  willConnect () {
    const mem = new Memory('4K', updateDisplay)
    const cpu = new CPU(mem, {}, updateDisplay, sendToElement, resetButtons)
    this.setState({
      isRunning: false,
      cpu: cpu,
      mem: mem
    })
  }

  reload () {
    this.connected()
  }

  haltCpu (button) {
    this.setState(state => ({
      ...state,
      isRunning: false
    }))
    debug('halt cpu execution')
    const stepButton = this.querySelector('#tonic-button-step')
    stepButton.reRender({ ...stepButton.props, disabled: false })
    const assembleButton = this.querySelector('#tonic-button-assemble')
    assembleButton.reRender({ ...assembleButton.props, disabled: false })
    button.querySelector('button').textContent = 'Run'
    this.state.cpu.sendInterrupt()
  }

  startCpu (button) {
    this.setState(state => ({
      ...state,
      isRunning: true
    }))
    debug('start cpu execution')
    const stepButton = this.querySelector('#tonic-button-step')
    stepButton.reRender({ ...stepButton.props, disabled: true })
    const assembleButton = this.querySelector('#tonic-button-assemble')
    assembleButton.reRender({ ...assembleButton.props, disabled: true })
    button.querySelector('button').textContent = 'Halt'
    this.state.cpu.clearInterrupt()
    this.state.cpu.run()
  }

  async click (e) {
    //
    // Button is clicked
    //
    const buttonAssemble = Tonic.match(e.target, '#tonic-button-assemble')
    const buttonRunHalt = Tonic.match(e.target, '#tonic-button-runhalt')
    const buttonStepCpu = Tonic.match(e.target, '#tonic-button-step')
    const buttonResetCpu = Tonic.match(e.target, '#tonic-button-reset')

    if (buttonAssemble) {
      if (this.state.isRunning) {
        return
      }
      debug('Assemble and Load')
      const [labels, instructions] = assemble(qs('#code-editor').state.code, this.state.cpu)
      debug(labels)
      instructions.forEach((el, idx) => { debug(`Machine code at ${idx}: ${el.toString(2).padStart(16, 0)}`) })
    }

    if (buttonRunHalt) {
      if (this.state.isRunning) {
        this.haltCpu(buttonRunHalt)
      } else {
        this.startCpu(buttonRunHalt)
      }
    }

    if (buttonStepCpu) {
      if (this.state.isRunning) {
        return
      }
      debug('Do step')
      this.state.cpu.step()
    }

    if (buttonResetCpu) {
      this.haltCpu(qs('#tonic-button-runhalt'))
      this.state.mem.reset()
      this.state.cpu.reset()
      this.querySelector('#console-window').value = this.state.cpu.messages.join('\n')
    }
  }

  render () {
    //
    // Render app container
    //
    return this.html`
      <tonic-sprite></tonic-sprite>
      <tonic-toaster id="app-toaster"></tonic-toaster>
      <section class="app-wrapper">
        <header>
          <h1>Super Simple CPU Simulator</h1>
          <tonic-button id="tonic-button-assemble">Assemble/Load</tonic-button>
          <tonic-button id="tonic-button-runhalt">Run</tonic-button>
          <tonic-button id="tonic-button-step">Step</tonic-button>
          <tonic-button id="tonic-button-reset">Reset</tonic-button>
        </header>
        <main>
          <div class="row">
            <code-editor id="code-editor" value="${example.join('\n')}"></code-editor>
            <register-display id="register-display" value=${this.state.cpu.state}></register-display>
            <memory-display id="memory-display" value=${Array.from(this.state.mem._mem)}></memory-display>
          </div>
          <console-output consolevalue="${this.state.cpu.messages}" outputvalue=""></console-output>
        </main>
      </section>
    `
  }
}

//
// Once the DOM is ready, load the main page.
//
async function ready () {
  Tonic.add(AppContainer)
  debug('loading CPU simulator')
}

document.addEventListener('DOMContentLoaded', ready)
