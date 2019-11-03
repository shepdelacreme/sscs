const Tonic = require('@optoolco/tonic')
// const { qs } = require('qs')

class CodeEditor extends Tonic {
  willConnect () {
    this.setState({
      code: this.props.value
    })
  }

  input (e) {
    const editor = Tonic.match(e.target, '#code-editor-input')

    if (editor) {
      this.setState(state => {
        return { ...state, code: editor.value }
      })
    }
  }

  render () {
    return this.html`
      <tonic-textarea
        id="code-editor-input"
        placeholder="Enter Instructions"
        rows="20"
        label="Code Editor"
        resize="none"
        spellcheck="false"
      >${this.state.code}</tonic-textarea>
    `
  }
}

Tonic.add(CodeEditor)
