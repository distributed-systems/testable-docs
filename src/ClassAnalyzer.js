(function() {
    'use strict';



    const ClassDocumentation = require('./ClassDocumentation');
    const Analyzer = require('./Analyzer');
    const log = require('ee-log');






    /**
    * extracts classes from an ast and return them as
    * array of ClassDocumentations
    */
    module.exports = class ClassAnalyzer extends Analyzer {




        /**
        * finds all classes & its methods inside the ast
        *
        * @param {mixed} ast the ast to analyze
        * @param {string} directory the rooot directory the source was loaded from
        * @param {string} filePath the path of the sourceFile
        *
        * @returns {array} classes an array of classes 
        */
        analyze(ast, directory, filePath) {
            const classDefinitions = [];


            // get classdefinitions from ast
            const classAsts = this.findNode(ast, 'ClassExpression');


            // parse each class
            if (classAsts && classAsts.length) {
                classAsts.forEach((classAst) => {
                    const definition = new ClassDocumentation();

                    definition.setRootPath(directory);
                    definition.setFile(filePath);

                    definition.line = classAst.loc.start.line;
                    definition.column = classAst.loc.start.column;


                    if (classAst.id) definition.name = classAst.id.name;
                    if (classAst.superClass && classAst.superClass.name) definition.superClass = classAst.superClass.name;


                    // check for dependencies
                    if (definition.superClass) definition.superClassDefinition = this.findDependency(ast, definition.superClass);



                    // what a hack :/
                    if (classAst.comments && classAst.comments.length) {
                        classAst.comments.forEach((comment) => {
                            definition.hasComment = true;
                            if (comment.data.description) definition.description = comment.data.description;
                            if (comment.data.tags && comment.data.tags.some(t => t.title === 'private')) definition.private = true;
                        });
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


                            // method meta
                            this.applyMethodComments(method, methodAst.comments);



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


                                    this.applyParameterComments(parameter, methodAst.comments);


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
        * analyzes block comments, applies the findings
        * to the target object passed into thei function
        *
        * @private
        *
        * @param {object} targetObject the object to apply the data to
        * @param {array} comments the comments to apply to the object
        */
        applyParameterComments(targetObject, comments) {
            if (comments && comments.length) {
                comments.filter(comment => comment.type === 'Block').forEach((comment) => {
                    comment = comment.data;


                    // scan tags
                    if (comment.tags && comment.tags.length) {
                        comment.tags.filter(tag => tag.title === 'param' && tag.name === targetObject.name).forEach((tag) => {
                            if (!targetObject.dataType) targetObject.dataType = [];

                            if (tag.description) targetObject.description = tag.description;
                            targetObject.hasComment = true;

                            if (tag.type) {
                                switch (tag.type.type) {
                                    case 'UnionType':
                                        tag.type.elements.forEach((element) => {
                                            targetObject.dataType.push(element.name);
                                        });
                                        break;

                                    case 'NameExpression':
                                        targetObject.dataType.push(tag.type.name);
                                        break;

                                    case 'OptionalType':
                                        targetObject.optional = true;
                                        targetObject.dataType.push(tag.type.expression.name);
                                        break;


                                    default:
                                        //log(tag);
                                }
                            }
                        });
                    }
                });
            }
        } 







        /**
        * analyzes block comments, applies the findings
        * to the target object passed into thei function
        *
        * @private
        *
        * @param {object} targetObject the object to apply the data to
        * @param {array} comments the comments to apply to the object
        */
        applyMethodComments(targetObject, comments) {
            if (comments && comments.length) {
                comments.filter(comment => comment.type === 'Block').forEach((comment) => {
                    comment = comment.data;
                    targetObject.hasComment = true;

                    if (comment.description) targetObject.description = comment.description;

                    // scan tags
                    if (comment.tags && comment.tags.length) {
                        comment.tags.forEach((tag) => {
                            switch (tag.title) {

                                case 'private':
                                    targetObject.private = true;
                                    break;


                                case 'returns':
                                    targetObject.returns = {
                                          description: tag.description
                                        , dataType: []
                                    };

                                    if (tag.type) {
                                        switch (tag.type.type) {
                                            case 'UnionType':
                                                tag.type.elements.forEach((element) => {
                                                    targetObject.returns.dataType.push(element.name);
                                                });
                                                break;

                                            case 'NameExpression':
                                                targetObject.returns.dataType.push(tag.type.name);
                                                break;


                                            default:
                                                //log(tag);
                                        }
                                    }
                                    break;
                            }
                        });
                    }
                });
            }
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
    };
})();
