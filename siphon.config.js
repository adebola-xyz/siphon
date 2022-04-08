module.exports = {
  rootDir: "test/src",
  outDir: "test/build",
  formatFiles: true,
  checkImageTypes: false,
  relations: [{ from: "start.html", to: "index.html" }],
  internalJS: true,
  internalStyles: true,
};