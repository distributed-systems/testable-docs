(function() {
    'use strict';


    const TestableDocs = require('../src/TestableDocs');



    new TestableDocs()
        .setSourcePath(__dirname, '../src')
        .executeTest(describe, it);
})();
