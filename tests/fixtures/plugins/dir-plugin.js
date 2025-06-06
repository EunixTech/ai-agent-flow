module.exports = {
  default: {
    name: 'dir-plugin',
    setup(runner) {
      runner.dirPluginLoaded = true;
    },
  },
};
