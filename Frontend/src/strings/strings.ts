/** Every user-facing string of the app, in one place. */
export const strings = {
  app: {
    title: 'Calculator',
  },
  display: {
    empty: '0',
    ariaLabel: 'Calculator display',
  },
  keys: {
    clear: 'AC',
    clearAriaLabel: 'All clear',
    deleteAriaLabel: 'Delete',
    percentAriaLabel: 'Percent',
    divideAriaLabel: 'Divide',
    squareRootAriaLabel: 'Square root',
    powerAriaLabel: 'Power',
    toggleSignAriaLabel: 'Toggle sign',
    multiplyAriaLabel: 'Multiply',
    subtractAriaLabel: 'Subtract',
    addAriaLabel: 'Add',
    equalsAriaLabel: 'Equals',
    decimalAriaLabel: 'Decimal point',
  },
  errors: {
    syntax: 'Syntax Error',
    math: 'Math Error',
    generic: 'Error',
    network: 'No connection',
  },
  history: {
    title: 'History',
    clear: 'Clear',
    clearAriaLabel: 'Clear history',
    empty: 'No calculations yet',
    hint: 'Tap a result to reuse it',
    show: 'Show history',
    hide: 'Hide history',
  },
} as const;
