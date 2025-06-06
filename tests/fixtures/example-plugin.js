module.exports = {
  default: {
    name: 'example-plugin',
    setup(runner) {
      runner.exampleInitialized = true;
    },
  },
};
