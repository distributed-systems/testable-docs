(function() {
    'use strict';



    /**
    * holds th einfromation for a class extracted from the
    * sourcecode
    *
    * @private
    */
    module.exports = class ClassDefinition {





        /**
        * class constructor
        */
        constructor() {
            this.methods = [];
        }





        /**
        * set the file path for the class
        *
        * @param {sting} path the path of the file containing the file
        */
        setFile(path) {
            this.filePath = path;
        }





        /**
        * retuns the relative path of the file in relation
        * to a path passed to this function
        *
        * @param {string} rootPath the path that should be removed from the files path
        *
        * @returns {string} filePath the relative path to the file
        */
        getRelativePath(rootPath) {
            if (this.filePath) return this.filePath.substr(rootPath ? rootPath.length+1 : 0);
            else return '';
        }
    };
})();
