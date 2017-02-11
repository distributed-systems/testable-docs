(function() {
    'use strict';




    const acorn = require('acorn');
    const log = require('ee-log');
    const commentParser = require('comment-parser');
    const ClassDefinition = require('./ClassDefinition');





    /**
    * analyzes sourcecode passed to it, extracts
    * classes, their methods, their paramters and
    * all block comments for those objects
    *
    * exported as `SourceCodeAnalyzer` of this module:
    *
    * `require('testable-docs').SourceCodeAnalyzer`
    */
    module.exports = class SourceCodeAnalyzer {






        /**
        * parses a file into an ast
        *
        * @param {string} data the text of the source file
        *
        * @returns {array} classDefinitions array containing the classes found in the file
        */
        parse(data) {
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
                    const definition = new ClassDefinition();

                    definition.line = classAst.loc.start.line;
                    definition.column = classAst.loc.start.column;


                    if (classAst.id) definition.name = classAst.id.name;
                    if (classAst.superClass && classAst.superClass.name) definition.superClass = classAst.superClass.name;


                    // check for dependencies
                    if (definition.superClass) definition.superClassDefinition = this.findDependency(ast, definition.superClass);


                    // find commetn blocks that are nearby
                    let classCommentAst = comments.filter((comment) => {
                        const distance = (classAst.start-comment.end);
                        return (distance > 0 && distance < 50);
                    });

                    // what a hack :/
                    if (classCommentAst.length) {
                        classCommentAst = classCommentAst[0];
                        if (classCommentAst.body && classCommentAst.body.description) definition.description = this.sanatize(classCommentAst.body.description);
                        if (classCommentAst.body && classCommentAst.body.description) definition.hasComment = true;
                        if (classCommentAst.body) definition.private = classCommentAst.body && classCommentAst.body.tags.some(t => t.tag === 'private');
                    }






                    // collect methods
                    const methods = this.findNode(classAst.body.body, 'MethodDefinition');


                    // process each method
                    if (methods && methods.length) {
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
                                return (distance > 0 && distance < 50);
                            });

                            
                            // still a hack :/
                            if (methodCommentAst.length) methodCommentAst = methodCommentAst[0];


                            // method meta
                            if (methodCommentAst.body) method.hasComment = true;
                            if (methodCommentAst.body && methodCommentAst.body.description) method.description = this.sanatize(methodCommentAst.body.description);
                            if (methodCommentAst.body) method.private = methodCommentAst.body && methodCommentAst.body.tags.some(t => t.tag === 'private');
                            if (methodCommentAst.body && methodCommentAst.body.tags.some(t => t.tag === 'returns')) {
                                const returns = methodCommentAst.body.tags.filter(t => t.tag === 'returns')[0];

                                method.returns = {
                                      type: returns.type
                                    , name: returns.name
                                    , description: returns.description ? this.sanatize(returns.description) : null
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
                    }
                    
    
                    definition.methods.sort((a, b) => {
                        if (a.private) {
                            return b.private ? (a.name > b.name ? 1 : -1) : -1;
                        } else {
                            return b.private ? -1 : (a.name > b.name ? 1 : -1);
                        }
                    });


                    // store
                    classDefinitions.push(definition);
                });
            }

            return classDefinitions;
        }








        /**
        * finds a require statment identified by 
        * a certain name of the variable or constant
        * it is assigned to. this will later be used
        * to resolve super class documentation
        *
        * @private
        *
        * @param {string} variableName the name of the variable 
        *                 to search for
        * @param {object} ast the ast to search the dependency in
        *
        * @returns {string} moduleName the name of the npm module the
        *                   variable resolves to
        */
        findDependency(ast, variableName) {
            const variables = this.findNode(ast, 'VariableDeclarator');

            if (variables && variables.length) {
                for (const item of variables) { 
                    if (item && item.length) {
                        for (const variable of item) { 

                            // check, this is the variable we're searching for
                            if (variable.id && variable.id.name === variableName) {

                                // make sure its a require statemnt
                                if (variable.init && variable.init.callee && variable.init.callee.name === 'require') {
                                    
                                    // make sure we got the correct arguments
                                    if (variable.init.arguments && variable.init.arguments.length && variable.init.arguments[0].type === 'Literal') {
                                        return  variable.init.arguments[0].value;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }








        /**
        * remove linebreaks, except for double ones,
        * remove whitespace
        *
        * @private
        *
        * @param {string} text the string to sanatize
        *
        * @returns {string} text the sanatized text
        */
        sanatize(text) {
            return text ? text.replace(/\n{2,}/gi, '%___paragraph___%').replace(/\n/gi, ' ').replace(/\s{2,}/gi, ' ').replace('%___paragraph___%', '\n\n') : null;
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
