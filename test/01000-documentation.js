(function() {
    'use strict';


    const TestableDocs = require('../src/TestableDocs');



    new TestableDocs()
        .docs(__dirname, '../docs')
        .source(__dirname, '../src')
        .executeTest(describe, it);
})();
