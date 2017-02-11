(function() {
    'use strict';


    const path = require('path');
    const fs = require('fs');
    const log = require('ee-log');
    const assert = require('assert');
    const SourceDirectoryAnalyzerSync = require('./SourceDirectoryAnalyzerSync');







    /**
    * tests all ecma scripts found in a given firectory.
    * loads the source files, extracts classes, their methods, 
    * their paramters and accompanying source commets.
    * 
    * runs mocha tests for all the extracted objects and
    * tests that everything is commented corretly. 
    */
    module.exports = class TestableDocs extends SourceDirectoryAnalyzerSync {





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


            // laod the source files
            const files = this.analyzeDirectory(this.source);


            describe('Documentation', () => {
                for (const classDefinition of files.values()) {

                    describe (`${classDefinition.private ? 'Private' : 'Public'} Class ${classDefinition.name} (${classDefinition.getRelativePath(this.source)})`, () => {
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
            });
        }
    }
})();
