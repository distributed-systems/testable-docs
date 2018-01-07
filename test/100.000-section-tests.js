'use strict';

const TestableDocs = require('../');
const section = require('section-tests');
const path = require('path');
section.use(new section.SpecReporter());




section('Testable Docs', (section) => {
    section('Preparations', (section) => {
        section.test('Load the Source', async() => {
            const TestableDocs = require('../');
        });

        section.test('Instantiate the class', async() => {
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
    docs.runSection(section);
});



