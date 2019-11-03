const Tonic = require('@optoolco/tonic')
// const { qs } = require('qs')

function * memGen (arr) {
  for (const el of arr) {
    yield el.toString(16).padStart(2, '0') + ' | '
    // yield `<div>${el.toString(16).padStart(2, '0')}</div>`
  }
}

class MemoryDisplay extends Tonic {
  willConnect () {
    this.setState({
      memory: this.props.value
    })
  }

  get value () {
    return this.state.memory
  }

  set value (value) {
    this.state.memory = value
    this.reRender()
  }

  render () {
    let mem = ''
    for (const v of memGen(this.state.memory)) {
      mem += v
    }

    return this.html`
      <tonic-textarea
        id="memory-display"
        rows="20"
        cols="81"
        label="Memory"
        resize="none"
        spellcheck="false"
        readonly="true"
      >${mem}</tonic-textarea>
    `
  }
}

Tonic.add(MemoryDisplay)
