(function() {
    'use strict';


    const path = require('path');
    const fs = require('fs');
    const log = require('ee-log');
    const assert = require('assert');
    const DirectoryLoaderSync = require('./DirectoryLoaderSync');
    const ClassAnalyzer = require('./ClassAnalyzer');
    const Parser = require('./Parser');







    /**
    * tests all ecma scripts found in a given directory.
    * loads the source files, extracts classes, their methods, 
    * their paramters and accompanying source commets.
    * 
    * runs mocha tests for all the extracted objects and
    * tests that everything is commented corretly. 
    */
    module.exports = class TestableDocs {





        /**
        * set the sourcecode path, indicates that all
        * sourcefiles should be tested
        *
        * @param {string} parts rest parameters for path parts that 
        *                 lead to the source folder
        *
        * @returns {object} this
        */
        setSourcePath(...parts) {
            this.source = path.join(...parts);

            // it's chainable
            return this;
        }





        /**
        * executes tests for all documentation files found
        * in the docs folder
        * 
        * @param {function} describe the mocha describe function
        * @param {function} it the mocah it function
        */
        executeTest(describe, it) {

            // prepare the parser ans analyzer
            const parser = new Parser();
            const classAnalyzer = new ClassAnalyzer();


            // laod files froom the directory
            const files = new DirectoryLoaderSync().loadFiles(this.source);


            describe('Documentation', () => {

                // parse & analyze
                for (const item of files) {
                    const filePath = item[0];
                    const sourceCode = item[1];

                    const ast = parser.parse(sourceCode);
                    const classes = classAnalyzer.analyze(ast, this.source, filePath);


                    for (const classDefinition of classes) {
                        describe (`${classDefinition.private ? 'Private' : 'Public'} Class ${classDefinition.name} (${classDefinition.getRelativePath()})`, () => {
                            it(`Class comment`, () => {
                                assert.equal(classDefinition.hasComment, true, `Missing comments for class!`);
                                assert.equal(!!classDefinition.description, true, `Missing description for class!`);
                            });


                            for (const method of classDefinition.methods) {
                                it(`${method.private ? 'Private' : 'Public'} Method ${method.name}`, () => {
                                    assert.equal(method.hasComment, true, `Missing comments for method!`);
                                    assert.equal(!!method.description, true, `Missing description for method!`);

                                    for (const parameter of method.parameters) {
                                        assert.equal(parameter.hasComment, true, `Missing comment for the parameter ${parameter.name}!`);
                                        assert.equal(!!parameter.description, true, `Missing description for the parameter ${parameter.name}!`);
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    }
})();
