(function() {
    'use strict';



    const path = require('path');
    const fs = require('fs');
    const log = require('ee-log');
    const SourceCodeAnalyzer = require('./SourceCodeAnalyzer');
    const ClassSet = require('./ClassSet');




    /**
    * analalyzes the sourcefiles of a directory
    *
    * @private
    */
    module.exports = class SourceDirectoryAnalyzer {





        /**
        * recursively scans source files & analyzes them  so that
        * they can be tested later on
        *
        * @param {string} directory the directory to scan for source files in
        * @param {map} files a map that contains all the analyzed data
        *
        * @returns {promise} files whe fulfilled, a map containing all data 
        *                    found in the sourcefiles
        */
        analyzeDirectory(directory, files = new ClassSet()) {


            return new Promise((resolve, reject) => {


                 // check, load and analyze all js files
                fs.readdir(directory, (err, fileList) => {
                    if (err) reject(err);
                    else {
                        Promise.all(fileList.map((file) => {
                            const filePath = path.join(directory, file);


                            if (path.extname(file) === '.js') {


                                // analyze
                                return this.loadSourceFile(filePath).then((classDefinitions) => {

                                    // prepare for returning
                                    classDefinitions.forEach((definition) => {

                                        // add filepath
                                        definition.setFile(filePath);

                                        // add to global set
                                        files.add(definition);
                                    });

                                    // done
                                    return Promise.resolve();
                                });                                
                            } else {

                                return new Promise((statResolve, statReject) => {


                                     // stats, check if its a directory
                                    fs.stat(filePath, (err, stats) => {
                                        if (err) statReject(err);
                                        else {


                                            // do directories recirsively
                                            if (stats.isDirectory()) this.loadSourceFiles(filePath).then(statResolve).catch(statReject);
                                            else statResolve();
                                        }
                                    });
                                });
                            }
                        })).then(() => resolve()).catch(reject);
                    }
                })
            });
        }






        /**
        * loads a single source file, analyzes it
        *
        * @private
        *
        * @param {string} filePath path to the source file to load and
        *                 analyze
        *
        * @returns {promise} classes when fulfilled, the data found in the sourfile
        */
        loadSourceFile(filePath) {


            return new Promise((resolve, reject) => {


                // read file
                fs.readFile(filePath, (err, data) => {
                    if (err) reject(err);
                    else {

                        // parse
                        const classes = new SourceCodeAnalyzer().parse(data.toString());

                        // check, done :)
                        resolve(classes);
                    }
                });
            });
        }
    }
})();
