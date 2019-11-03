const Tonic = require('@optoolco/tonic')
// const { qs } = require('qs')

class ConsoleOutput extends Tonic {
  willConnect () {
    this.setState({
      consolevalue: this.props.consolevalue,
      outputvalue: this.props.outputvalue
    })
  }

  set outputvalue (value) {
    this.state.outputvalue = value
    this.reRender()
  }

  set consolevalue (value) {
    this.state.consolevalue = value
    this.reRender()
  }

  render () {
    return this.html`
      <tonic-tabs selected="tab-console">
        <tonic-tab
          id="tab-console"
          for="tab-panel-console">Console</tonic-tab>
        <tonic-tab
          id="tab-output"
          for="tab-panel-output">Output</tonic-tab>
      </tonic-tabs>

      <tonic-tab-panel id="tab-panel-console">
        <tonic-textarea
          id="console-window"
          placeholder=""
          rows="16"
          label="Console Window"
          readonly="true"
          resize="none"
          spellcheck="false"
        >${this.state.consolevalue.join('\n')}
        </tonic-textarea>
      </tonic-tab-panel>

      <tonic-tab-panel id="tab-panel-output">
        <tonic-textarea
          id="output-window"
          placeholder=""
          rows="16"
          label="Output Window"
          readonly="true"
          resize="none"
          spellcheck="false"
        >${this.state.outputvalue}
        </tonic-textarea>
      </tonic-tab-panel>

    `
  }
}

Tonic.add(ConsoleOutput)
