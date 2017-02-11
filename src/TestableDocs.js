(function() {
    'use strict';


    const path = require('path');
    const fs = require('fs');
    const acorn = require('acorn');
    const log = require('ee-log');
    const commentParser = require('comment-parser');
    const assert = require('assert');




    module.exports = class TestableDocs {




        /**
        * class constructor
        *
        * @returns {object} this class instance
        */
        constructor() {

            // storage for classes, is used to check which 
            // classes were tested and which were not 
            this.files = new Map();
        }




        /**
        * set the documentation definition path
        *
        * @param {string} parts rest parameters for path parts that 
        *                 lead to the docs folder
        *
        * @returns {object} this
        */
        docs(...parts) {
            this.docs = path.join(...parts);

            // it's chainable
            return this;
        }





        /**
        * set the sourcecode path, indicates that all
        * sourcefiles should be tested
        *
        * @param {string} parts rest parameters for path parts that 
        *                 lead to the source folder
        *
        * @returns {object} this
        */
        source(...parts) {
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
            this.loadSourceFiles(this.source);


            describe('Documentation', () => {

                for (const file of this.files.values()) {
                    const filePath = file.file.substr(this.source.length+1);

                    for (const cls of file.classes.values()) {
                        describe (`Class ${cls.name} (${filePath})`, () => {

                            for (const method of cls.methods) {
                                it(`Method ${method.name}`, () => {
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





        /**
        * recursively scans source files & analyzes them  so that
        * they can be tested later on
        *
        * @private
        *
        * @param {string} directory the directory to scan for source files in
        *
        * @returns {promise} promise fulfilled when everything was loaded
        */
        loadSourceFiles(directory) {

            const files = fs.readdirSync(directory);


            // check, load and analyze all js files
            files.forEach((file) => {
                const filePath = path.join(directory, file);


                if (path.extname(file) === '.js') {


                    // analyze
                    const classDefinitions = this.loadSourceFile(filePath);

                    // store
                    if (!this.files.has(filePath)) this.files.set(filePath, {file: filePath, classes: new Set()});
                    classDefinitions.forEach((definition) => {
                        this.files.get(filePath).classes.add(definition);
                    });
                } else {


                    // stats, check if its a directory
                    const stats = fs.statSync(filePath);

                    // do directories recirsively
                    if (stats.isDirectory()) this.loadSourceFiles(filePath);
                }
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
        * @returns {promise} promise fulfilled when the file was loaded and analyzed
        */
        loadSourceFile(filePath) {

            // read file
            const data = fs.readFileSync(filePath);
               
            // parse
            return this.parseFile(data.toString());
        }





        /**
        * parses a file into an ast
        *
        * @private
        *
        * @param {string} data the text of the source file
        *
        * @returns {array} classDefinitions array containing the classes found in the file
        */
        parseFile(data) {
            let comments = [];
            const classDefinitions = [];


            // parse file
            const ast = acorn.parse(data, {
                  locations: true
                , onComment: comments
            });



            // get parsed lock comments
            comments = comments.filter(comment => comment.type === 'Block');

            // parse
            comments.forEach((comment) => {

                // the comment parser is very strict on spacing, make sure 
                // the input is working for it
                const text = `/** \n ${comment.value} \n*/`.replace(/\n\s*\*/gi, '\n *');

                // parse
                comment.body = commentParser(text);

                // assumptions, so many assumptions
                if (comment.body && comment.body.length) comment.body = comment.body[0];
            });





            // get classdefinitions from ast
            const classAsts = this.findNode(ast, 'ClassExpression');



            // parse each class
            if (classAsts && classAsts.length) {
                classAsts.forEach((classAst) => {
                    const definition = {
                          name: 'anonymous'
                        , line: classAst.loc.start.line
                        , column: classAst.loc.start.column
                        , methods: []
                    };

                    if (classAst.id) definition.name = classAst.id.name;


                    // collect methods
                    const methods = this.findNode(classAst.body.body, 'MethodDefinition');


                    // process each method
                    methods.forEach((methodAst) => {
                        const method = {
                              name: 'anonymous'
                            , line: methodAst.loc.start.line
                            , column: methodAst.loc.start.column
                            , parameters: []
                        }


                        // set name
                        if (methodAst.key) method.name = methodAst.key.name;



                        // find commetn blocks that are nearby
                        let methodCommentAst = comments.filter((comment) => {
                            const distance = (methodAst.key.start-comment.end);
                            return (distance > 0 && distance < 100);
                        });

                        
                        // what a hack :/
                        if (methodCommentAst.length) methodCommentAst = methodCommentAst[0];


                        // method meta
                        if (methodCommentAst.body) method.hasComment = true;
                        if (methodCommentAst.body && methodCommentAst.body.description) method.description = methodCommentAst.body.description.replace(/\n/gi, ' ').replace(/\s{2,}/gi, ' ');
                        if (methodCommentAst.body) method.private = methodCommentAst.body && methodCommentAst.body.tags.some(t => t.tag === 'private');
                        if (methodCommentAst.body && methodCommentAst.body.tags.some(t => t.tag === 'returns')) {
                            const returns = methodCommentAst.body.tags.filter(t => t.tag === 'returns')[0];

                            method.returns = {
                                  type: returns.type
                                , name: returns.name
                                , description: returns.description ? returns.description.replace(/\n/gi, ' ').replace(/\s{2,}/gi, ' ') : null
                            };
                        }




                        // get parameters
                        if (methodAst.value && methodAst.value.params) {
                            methodAst.value.params.forEach((paramAst) => {
                                let parameter;

                                if (paramAst.type === 'RestElement') {
                                    parameter = {
                                          name: paramAst.argument.name
                                        , type: 'rest'
                                    };
                                } else if (paramAst.type === 'AssignmentPattern') {
                                    parameter = {
                                          name: paramAst.left.name
                                        , type: 'defaultValue'
                                        , default: paramAst.right.value
                                    };
                                } else {
                                    parameter = {
                                          name: paramAst.name
                                        , type: 'simple'
                                    };
                                }


                                // argument meta
                                if (methodCommentAst.body && methodCommentAst.body.tags.some(t => t.tag === 'param' && t.name === parameter.name)) {
                                    const param = methodCommentAst.body.tags.filter(t => t.tag === 'param' && t.name === parameter.name)[0];

                                    parameter.hasComment = true;
                                    parameter.type = param.type;
                                    parameter.optional = param.optional;
                                    parameter.description = param.description ? param.description.replace(/\n/gi, ' ').replace(/\s{2,}/gi, ' ') : null;
                                }


                                method.parameters.push(parameter);
                            });
                        }



                        definition.methods.push(method);
                    });
                    
                    // store
                    classDefinitions.push(definition);
                });
            }

            return classDefinitions;
        }







        /**
        * finds a specific node in the ast, returrns it
        *
        * @private
        *
        * @param {mixed} ast the ast to search in
        * @param {string} nodeName the name of the node to find
        *
        * @returns {object} partialAst the matched part of the ast 
        * and its children
        */
        findNode(ast, nodeName) {
            if (Array.isArray(ast)) {
                let nodes = [];

                for (const node of ast) {
                    if (node.type === nodeName) nodes.push(node);
                    else nodes.push(this.findNode(node, nodeName));
                }

                nodes = nodes.filter(n => !!n);

                // return non empty nodes
                return nodes.length ? (nodes.length === 1 && Array.isArray(nodes[0]) ? nodes[0] : nodes) : null;
            } else if (typeof ast === 'object') {
                if (ast.type === nodeName) return ast;
                else if (ast.right) return this.findNode(ast.right, nodeName);
                else if (ast.body) return this.findNode(ast.body, nodeName);
                else if (ast.expression) return this.findNode(ast.expression, nodeName);
                else if (ast.callee) return this.findNode(ast.callee, nodeName);
                else if (ast.declarations) return this.findNode(ast.declarations, nodeName);
            }
        }

    }
})();
