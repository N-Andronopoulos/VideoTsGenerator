#!/usr/local/bin/node

/**
 * Created by Nikola Andronopoulos on 09/01/2017.
 *
 * Created for Geotag Aeroview CDN, cause why Akamai?
 */

'use strict';

// Fix errors if the script starts from another path
process.chdir(__dirname);

// Requires and what not
const lineReader = require('readline').createInterface({
    input: process.stdin
});
const path = require('path');
const fs = require('fs');
const url = require('url');
const execSync = require('child_process').execSync;

// Paths and arguments
const inputPrefix = process.argv[2];
const outputPrefix = process.argv[3];
const cdnUrlPrefix = process.argv[4] || 'http://localhost:3000/';
const m3u8Prefix = 'index', m3u8Postfix = '.m3u8';
let processedDirs = new Set();


/**
 * This function renders the arguments for the ffmpeg lib.
 * @param input The input file
 * @param url The prefix url in playlist.
 * @param playlist The playlist file name.
 * @param tsPath The filename of the ts files
 * @returns {string} The full arguments.
 */
const renderFFmpegArgs = (input, url, playlist, tsPath) => {
    let ffmpegArgs = `-i ${input} \
-vcodec copy \
-vbsf:v h264_mp4toannexb \
-start_number 0 \
-hls_time 10 \
-hls_list_size 0 \
-f hls \
-segment_list_flags hls \
-hls_base_url ${url} \
-hls_segment_filename ${tsPath} \
${playlist}`;

    console.log(ffmpegArgs);
    return ffmpegArgs;
};

/**
 * Run the hls generator.
 * @param args The ffmpeg arguments.
 */
const runFFmpeg = (args) => {
    execSync('ffmpeg ' + args);
};

/**
 * Compiles file name and returns the m3u8 playlist file name.
 * @param file The file name
 * @returns {string} M3u8 Playlist file name
 */
const getM3u8Name = (file) => {
    let name = file.replace(path.extname(file), '');
    let rate = name.match(/\d+k$/g);
    if (!rate) {
        return m3u8Prefix + m3u8Postfix;
    } else {
        return m3u8Prefix + rate + m3u8Postfix;
    }
};

/**
 * Sets up the project, eg output directory existence etc...
 */
const setup = () => {
    if (!fs.existsSync(outputPrefix)) {
        fs.mkdirSync(outputPrefix);
        process.stderr.write('Path was not found, created.\n');
    } else {
        process.stderr.write('Path Exists.\n');
    }
};

/**
 * Main ts & m3u8 generation 'loop'.
 * Parses input line by line create directories on output and generates TS files with m3u8 playlists.
 */
let renderTsFiles = () => {
    let inputFilePath, m3u8Path, tsFullPath, currentOutDir, cdnUrl;

    lineReader.on('line', (line) => {
        // Quick skip
        if (path.extname(line) !== '.mp4') {
            return;
        }

        // Oh noes variables
        inputFilePath = path.join(inputPrefix, line);
        cdnUrl = url.resolve(cdnUrlPrefix, path.join(path.dirname(line), 'chunks')) + '/';
        currentOutDir = path.join(outputPrefix, path.dirname(line));
        m3u8Path = path.join(currentOutDir, getM3u8Name(path.basename(line)));
        tsFullPath = path.join(currentOutDir, 'chunks', path.basename(line.replace(path.extname(line), '-%03d.ts')));

        // Create the directories cause ffmpeg doesn't for some reason.
        execSync(`mkdir -p ${path.join(currentOutDir, 'chunks')}`);
        process.stderr.write(`Input is ${inputFilePath}\nM3u8 is ${m3u8Path}\nTsPath is ${tsFullPath}\nCDN is ${cdnUrl}\n`);
        // Go go power rangers!
        runFFmpeg(renderFFmpegArgs(inputFilePath, cdnUrl, m3u8Path, tsFullPath));
    });

    lineReader.on('close', () => {
        process.stderr.write('Finished\n');
    });
};

// Go go
setup();
renderTsFiles();
