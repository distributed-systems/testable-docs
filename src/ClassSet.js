(function() {
    'use strict';



    /**
    * Set for storing classes with some handy additional functions
    *
    * @private
    */
    module.exports = class ClassSet extends Set {





        /**
        * checks if a given class exists
        *
        * @param {string} className the name of the class to search for
        *
        * @returns {boolean} hasClass true if the class exists
        */
        hasClass(className) {
            for (cls of this.values()) {
                if (cls.name === className) return true;
            }

            return false;
        }







        /**
        * gets the first class with the given
        * name that can be found
        *
        * @param {string} className the name of the class to seach for
        *
        * @returns {objecet} [classDefinition] the classDefinition or null if no class was found
        */
        getClass(className) {
            for (cls of this.values()) {
                if (cls.name === className) return cls;
            }

            return null;
        }







        /**
        * removes teh first class found by it's name
        *
        * @param {string} className the name of the class to seach for
        *
        * @returns {boolean} wasRemoved true if the class was found and removed
        */
        removeClass(className) {
            for (cls of this.values()) {
                if (cls.name === className) {
                    file.classes.delete(cls);
                    return true;
                }
            }

            return false;
        }
    };
})();