(function() {
    'use strict';



    /**
    * represents a part of the documentation
    */
    module.exports = class DocumentationPart {






        /**
        * make sure all classes implement this class correctly
        */
        toJSON() {
            throw new Error(`The toJSON method must implemented by the implementing class!`);
        }
    }
})();
