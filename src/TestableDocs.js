'use strict';


const path = require('path');
const fs = require('fs');
const log = require('ee-log');
const assert = require('assert');
const JavascriptSourceDocs = require('javascript-source-docs');







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
    * set up the class
    *
    * @param {string} projectRoot the root folder of the project
    */
    constructor({projectRoot} = {}) {
        this.sourceDocs = new JavascriptSourceDocs({projectRoot});
    }





    /**
    * Add custom files that need to be analyzed. If the paths start
    * with the project root path passed to the constructor the project
    * root path will be removed from the files path
    *
    * @param {...string} files paths for files that need to be parsed
    */
    addFiles(...files) {
        this.sourceDocs.addFilesSync(...files);
    }






    /**
    * analyzes the source files
    */
    analyze() {
        this.docs = this.sourceDocs.analyzeSync();
    }






    /**
    * executes tests for all documentation files found
    * in the docs folder
    * 
    * @param {function} section the section variable from the section tester
    */
    runSection(section) {
        section('Documentation', (section) => {

            for (const doc of this.docs) {
                for (const classDefinition of doc.classes) {
                    section (`${classDefinition.private ? 'Private' : 'Public'} Class ${classDefinition.name} (${classDefinition.getRelativePath()})`, (section) => {
                        section.test(`Class comment`, async () => {
                            assert.equal(classDefinition.hasComment, true, `Missing comments for class!`);
                            assert.equal(!!classDefinition.description, true, `Missing description for class!`);
                        });


                        for (const method of classDefinition.methods) {
                            section.test(`${method.private ? 'Private' : 'Public'} Method ${method.name}`, async () => {
                                assert.equal(method.hasComment, true, `Missing comments for method!`);
                                assert.equal(!!method.description, true, `Missing description for method!`);

                                for (const parameter of method.parameters) {
                                    assert.equal(parameter.hasComment, true, `Missing comment for the parameter ${parameter.name}!`);

                                    if (parameter.values) {
                                        for (const value of parameter.values) {
                                            assert.equal(value.hasComment, true, `Missing comment for the parameter value ${value.name}!`);
                                            assert.equal(!!value.description, true, `Missing description for the parameter value ${value.name}!`);
                                        }
                                    } else {
                                        assert.equal(!!parameter.description, true, `Missing description for the parameter ${parameter.name}!`);
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
    }






    /**
    * executes tests for all documentation files found
    * in the docs folder
    * 
    * @param {function} describe the describe variable from the mocha tester
    * @param {function} it the it variable from the mocha tester
    */
    runMocha(describe, it) {
        describe('Documentation', () => {

            for (const doc of this.docs) {
                for (const classDefinition of doc.classes) {
                    describe (`${classDefinition.private ? 'Private' : 'Public'} Class ${classDefinition.name} (${classDefinition.getRelativePath()})`, () => {
                        it(`Class comment`, async () => {
                            assert.equal(classDefinition.hasComment, true, `Missing comments for class!`);
                            assert.equal(!!classDefinition.description, true, `Missing description for class!`);
                        });


                        for (const method of classDefinition.methods) {
                            it(`${method.private ? 'Private' : 'Public'} Method ${method.name}`, async () => {
                                assert.equal(method.hasComment, true, `Missing comments for method!`);
                                assert.equal(!!method.description, true, `Missing description for method!`);

                                for (const parameter of method.parameters) {
                                    assert.equal(parameter.hasComment, true, `Missing comment for the parameter ${parameter.name}!`);

                                    if (parameter.values) {
                                        for (const value of parameter.values) {
                                            assert.equal(value.hasComment, true, `Missing comment for the parameter value ${value.name}!`);
                                            assert.equal(!!value.description, true, `Missing description for the parameter value ${value.name}!`);
                                        }
                                    } else {
                                        assert.equal(!!parameter.description, true, `Missing description for the parameter ${parameter.name}!`);
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
    }
}
