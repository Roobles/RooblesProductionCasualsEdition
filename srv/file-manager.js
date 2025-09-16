const fs = require('node:fs');
const { join, extname, parse } = require('node:path');
const { execSync } = require('child_process');

class FileManager {

  constructor(config, logger) {
    this.logger = logger;
    this.config = config;
  }

  getFileFullName(path, file) {
    return join(path, file);
  }

  getFileInfo(fullFileName) {
    return fs.statSync(fullFileName);
  }

  toFileDataStructure(path, file) {

    const fullFileName = this.getFileFullName(path, file);
    const data = this.getFileInfo(fullFileName);
    const parsedFile = parse(file);
    return {
      file: file,
      name: parsedFile.name,
      ext: parsedFile.ext,
      dir: path,
      fullFileName: fullFileName,
      stats: data
    };
  }

  getDirectoryFiles(path, ext = undefined) {
    const allFiles = fs.readdirSync(path)
      .map(file => this.toFileDataStructure(path, file));

    return ext === undefined
      ? allFiles
      : allFiles.filter(f => f.ext == `.${ext}`);
  }

  findLatestFileInDir(path) {
    const files = this.getDirectoryFiles(path)

    if(files === undefined || files.length < 1)
      return undefined;

    return files.reduce((prev, curr) => prev.stats.mtimeMs > curr.stats.mtimeMs ? prev : curr);
  }

  readObjectFromFile(fullFileName) {
    const data = this.readFileContents(fullFileName);
    return JSON.parse(data);
  }

  readFileContents(fullFileName) {
    return fs.readFileSync(fullFileName, 'utf8');
  }

  writeFileContents(fullFileName, contents) {
    const tarContents = (typeof contents === 'object')
      ? JSON.stringify(contents, null, '  ')
      : contents;

    fs.writeFileSync(fullFileName, tarContents);
  }

  deleteFile(fullFileName) {
    try {
      fs.unlinkSync(fullFileName);
    } catch(err) {
      this.logger.warn(`Unable to delete file '${fullFileName}': ${err}`);
    }
  }

  deleteFilesOfTypes() {
    const argc = arguments.length;
    if(argc < 2)
      throw new Error("Missing arguments for file deletion.");

    var tarFiles = new Array();
    const directory = arguments[0];
    for(var i=1; i<argc; i++) {
      const tarExt = arguments[i];
      tarFiles = tarFiles.concat(this.getDirectoryFiles(directory, tarExt));
    }

    for(const dFile of tarFiles) {
      this.deleteFile(dFile.fullFileName);
    }
  }
}

module.exports = {
  FileManager: FileManager
};
