(function() {
    'use strict';



    const path = require('path');
    const fs = require('fs');
    const log = require('ee-log');






    /**
    * loads all file of a directory
    *
    * @private
    */
    module.exports = class DirectoryLoader {





        /**
        * recursively loads sourcefiles from a directory
        *
        * @param {string} directory the directory to scan for source files in
        * @param {map=} files a map that contains all the files
        *
        * @returns {promise} files when fulfiled, a map containing all file contents
        */
        loadFiles(directory, files = new Map()) {
            return new Promise((resolve, reject) => {


                 // check, load and analyze all js files
                fs.readdir(directory, (err, fileList) => {
                    if (err) reject(err);
                    else {
                        Promise.all(fileList.map((file) => {
                            const filePath = path.join(directory, file);


                            if (path.extname(file) === '.js') {


                                // load
                                return this.loadSourceFile(filePath).then((sourceCode) => {

                                    // store
                                    files.set(filePath, sourceCode);

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
                                            if (stats.isDirectory()) this.loadFiles(filePath).then(statResolve).catch(statReject);
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
        * @returns {promise} sourceCode when fulfilled, the sourceCode found in the file
        */
        loadSourceFile(filePath) {


            return new Promise((resolve, reject) => {


                // read file
                fs.readFile(filePath, (err, data) => {
                    if (err) reject(err);
                    else resolve(data.toString());
                });
            });
        }
    }
})();
