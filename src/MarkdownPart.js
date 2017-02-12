(function() {
    'use strict';



    const DocumentationPart = require('./DocumentationPart');
    const path = require('path');
    const fs = require('fs');






    /**
    * a documentation part consisting of markdown text
    */
    module.exports = class MarkdownPart extends DocumentationPart {






        /**
        * set the text on the part
        *
        * @param {string} text the markdown text
        */
        fromText(text) {
            this.text = text;
        }






        /**
        * set a file that should be loaded as text
        *
        * @param {string} filePathParts the path part to the file to load. the parts will be joined
        */
        fromPath(...filePathParts) {
            this.filePath = path.join(...filePathParts);
        }






        /**
        * returns a josn document representing this part
        *
        * @returns {promise} jsonDocument a promise returning the part as js object
        */
        toJSON() {
            if (this.text) {
                return Promise.resolve(this.toDocument(this.text));
            } else if (this.filePath) {
                return new Promise((resolve, reject) => {
                    fs.readFile(this.filePath, (err, data) => {
                        if (err) reject(err);
                        else resolve(this.toDocument(data.toString()));
                    });
                });
            } else return Promise.reject(new Error(`Markdown part without text or file reference!`));
        }






        /**
        * creates the document that will be returned to the user
        *
        * @private
        *
        * @param {string} markdownDocument the markdown document
        *
        * @returns {object} markdownDocument the document that later is returned to the user
        */
        toDocument(markdownDocument) {
            return {
                  text: markdownDocument
                , kind: 'markdown'
            };
        }
    }
})();
