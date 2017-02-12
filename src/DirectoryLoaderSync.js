(function() {
    'use strict';



    const path = require('path');
    const fs = require('fs');
    const log = require('ee-log');
    const SourceCodeAnalyzer = require('./SourceCodeAnalyzer');
    const Parser = require('./Parser');
    const ClassSet = require('./ClassSet');




    /**
    * analalyzes the sourcefiles of a directory in a blocking
    * synchronous way
    *
    * @private
    */
    module.exports = class SourceDirectoryAnalyzerSync {





        /**
        * recursively loads sourcefiles from a directory
        *
        * @param {string} directory the directory to scan for source files in
        * @param {map=} files a map that contains all the files
        *
        * @returns {map} files a map containing all file contents
        */
        loadFiles(directory, files = new Map()) {


            // check, load and analyze all js files
            fs.readdirSync(directory).forEach((file) => {
                const filePath = path.join(directory, file);


                if (path.extname(file) === '.js') {


                    // load
                    files.set(filePath, this.loadSourceFile(filePath));
                } else {


                    // stats, check if its a directory
                    const stats = fs.statSync(filePath);

                    // do directories recirsively
                    if (stats.isDirectory()) this.loadFiles(filePath);
                }
            });


            return files;
        }





        /**
        * loads a single source file, analyzes it
        *
        * @private
        *
        * @param {string} filePath path to the source file to load and
        *                 analyze
        *
        * @returns {string} sourceCode the sourceCode of the file
        */
        loadSourceFile(filePath) {

            // read file
            return fs.readFileSync(filePath).toString();
        }
    }
})();
