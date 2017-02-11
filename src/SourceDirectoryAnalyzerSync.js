(function() {
    'use strict';



    const path = require('path');
    const fs = require('fs');
    const log = require('ee-log');
    const SourceCodeAnalyzer = require('./SourceCodeAnalyzer');
    const ClassSet = require('./ClassSet');




    /**
    * analalyzes the sourcefiles of a directory in a blocking
    * synchronous way
    *
    * @private
    */
    module.exports = class SourceDirectoryAnalyzerSync {





        /**
        * recursively scans source files & analyzes them  so that
        * they can be tested later on
        *
        * @param {string} directory the directory to scan for source files in
        * @param {map} files a map that contains all the analyzed data
        *
        * @returns {map} files a map containing all data found in the sourcefiles
        */
        analyzeDirectory(directory, files = new ClassSet()) {

            // check, load and analyze all js files
            fs.readdirSync(directory).forEach((file) => {
                const filePath = path.join(directory, file);


                if (path.extname(file) === '.js') {


                    // analyze
                    const classDefinitions = this.loadSourceFile(filePath);


                    // prepare for returning
                    classDefinitions.forEach((definition) => {

                        // add filepath
                        definition.setFile(filePath);

                        // add to global set
                        files.add(definition);
                    });
                } else {


                    // stats, check if its a directory
                    const stats = fs.statSync(filePath);

                    // do directories recirsively
                    if (stats.isDirectory()) this.loadSourceFiles(filePath);
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
        * @returns {array} classes the data found in the sourfile
        */
        loadSourceFile(filePath) {

            // read file
            const data = fs.readFileSync(filePath);
               
            // parse
            return new SourceCodeAnalyzer().parse(data.toString());
        }
    }
})();
