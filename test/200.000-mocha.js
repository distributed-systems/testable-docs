'use strict';

const TestableDocs = require('../');
const path = require('path');




describe('Testable Docs', (section) => {
    describe('Preparations', (section) => {
        it('Load the Source', async() => {
            const TestableDocs = require('../');
        });

        it('Instantiate the class', async() => {
            const TestableDocs = require('../');
            new TestableDocs({
                projectRoot: path.join(__dirname, '../')
            });
        });
    });


    const docs = new TestableDocs({
        projectRoot: path.join(__dirname, '../')
    });

    docs.addFiles(path.join(__dirname, '../', require('../package.json').main));
    docs.analyze();
    docs.runMocha(describe, it);
});



