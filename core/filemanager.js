const fs = require('fs')
const path = require('path')

class FileManager {
    /**
     * @param {string} workPath
     * @param {string} outputPath
     */
    constructor(workPath, outputPath) {
        this.workPath = workPath ?? "src";
        this.outputPath = outputPath ?? "output";
    }

    /**
     * @param {string} relativePath
     * @returns {Array<string>}
     */
    lookForHtmlFiles(relativePath) {
        let entries = fs.readdirSync(
            path.join(this.workPath, relativePath), 
            { withFileTypes: true }
        );
        
        let files = [];

        for (let entry of entries) {
            if (entry.isDirectory()) {
                let subfiles = this.lookForHtmlFiles(path.join(relativePath, entry.name));
                files = files.concat(subfiles);
                continue;
            }

            if (!this.isProperHtmlFile(entry)) continue;
            
            let filePath = entry.name;
            let fileRelPath = path.join(relativePath, filePath);
            files.push(fileRelPath);
        }

        return files;
    }

    /**
     * @private
     * @param {fs.Dirent} dirent
     * @returns {boolean}
     */
    isProperHtmlFile(dirent) {
        if (!dirent.isFile()) return false;
        if (dirent.name.startsWith("_")) return false;
        if (!dirent.name.endsWith(".html") && !dirent.name.endsWith(".htm")) return false;

        return true; 
    }

    /**
     * @param {string} filePath 
     * @returns {Buffer}
     */
    readFile(filePath) {
        return fs.readFileSync(path.join(this.workPath, filePath));
    }

    /**
     * 
     * @param {string} filePath 
     * @param {Buffer | string} data 
     */
    writeFile(filePath, data) {
        let fullPath = path.join(this.outputPath, filePath);
        let fullDir = path.dirname(fullPath);

        if (!fs.existsSync(fullDir)) {
            fs.mkdirSync(fullDir, { recursive: true });
        }

        fs.writeFileSync(fullPath, data);
    }

    /**
     * @param {string} dir 
     */
    clearDirectory(dir) {
        dir = dir ?? this.outputPath;
        let entries = fs.readdirSync(dir, { withFileTypes: true });

        for (let entry of entries) {
            if (this.isProperHtmlFile(entry)) {
                fs.rmSync(path.join(dir, entry.name));
            }
        }
    }

    /**
     * 
     * @param {string} dir
     * @returns {Array<string>}
     */
    listDirs(dir) {
        dir = dir ?? this.workPath;
        let entries = fs.readdirSync(dir, { withFileTypes: true });
        let paths = [];

        for (let entry of entries) {
            if (entry.isDirectory()) {
                paths.push(entry.name);
            }
        }

        return paths;
    }
}

module.exports = { FileManager };