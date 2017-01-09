/**
 * Created by nikolas on 09/01/2017.
 */

'use strict';

const lineReader = require('readline').createInterface({
    input: process.stdin
});
const path = require('path');
const fs = require('fs');

const outputPrefix = process.argv[2];
const cdnUrlPrefix = process.argv[3] | 'http://localhost:3000/';
const m3u8Prefix = 'index', m3u8Postfix = '.m3u8';

/**
 * Compiles file name and returns the m3u8 playlist file name.
 * @param file The file name
 * @returns {string} M3u8 Playlist file name
 */
const getM3u8Name = (file) => {
    let name = file.replace(path.extname(file), '');
    let rate = name.match(/\d+k$/g);
    return m3u8Prefix + rate + m3u8Postfix;
};

if(!fs.existsSync(outputPrefix)) {
    fs.mkdirSync(outputPrefix);
    process.stdout.write('Path was not found, created.\n');
} else {
    process.stdout.write('Path Exists.\n');
}

let savePath, currentDirectory, currentBaseName, m3u8Path;

lineReader.on('line', (line) => {
    savePath = path.join(outputPrefix, line);
    currentDirectory = path.join(outputPrefix, path.dirname(line));
    currentBaseName = path.basename(line);

    if(path.extname(line) === '.mp4') {
        console.log('Found mp4, compiling!');
        m3u8Path = path.join(currentDirectory, getM3u8Name(currentBaseName));
    }

    process.stdout.write(m3u8Path + '\n');
});

lineReader.on('close', ()=> {
    process.stderr.write('end\n');
});
