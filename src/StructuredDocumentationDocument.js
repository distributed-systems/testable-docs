(function() {
    'use strict';




    /**
    * collects information from sourcefiles to create structureds
    * data that can be used to atomatically create documentation.
    * returns descirptions as mardown formatted text.
    */
    module.exports = class StructuredDocumentationDocument {





        constructor() {

            // storage for part generators. parts may have a certain type
            // so that they can be processed later easily
            this.parts = new Set();
        }






        /**
        * collects all information and returns 
        * a structured document in json format
        *
        */
        getDocumentation() {

        }











        /**
        * set the source code path. if not set the source will
        * not be analyzed
        *
        * @param {string} parts rest parameters for path parts that 
        *                 lead to the source folder
        *
        * @returns {object} this
        */
        setSourcePath(...parts) {
            this.sourcePath = path.join(...parts);

            // it's chainable
            return this;
        }





        /**
        * collects all required information for the document
        */
        collectParts() {

            // firs of all, scan the sourcode if requested to do so
            return this.collectSourceInfo(this.sourcePath).then((fileMap) => {
                this.fileMap = fileMap;


                return 1;
            });
            return this.decribe().then(() => {

                return this;
            });
        }




        collectSourceInfo(folder) {

        }
    }
})();
