#!/usr/local/bin/node

/**
 * Created by nikolas on 09/01/2017.
 */

'use strict';

// Fix errors if the script starts from another path
process.chdir(__dirname);

const lineReader = require('readline').createInterface({
    input: process.stdin
});
const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;

const outputPrefix = process.argv[2];
const cdnUrlPrefix = process.argv[3] || 'http://localhost:3000/';
const m3u8Prefix = 'index', m3u8Postfix = '.m3u8';

//const ls = spawn('ls', ['-lh', '/usr']);

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
-segment_list ${playlist} \
${tsPath}`;

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

if (!fs.existsSync(outputPrefix)) {
    fs.mkdirSync(outputPrefix);
    process.stdout.write('Path was not found, created.\n');
} else {
    process.stdout.write('Path Exists.\n');
}

let savePath, currentDirectory, currentBaseName, m3u8Path, tsFullPath;

lineReader.on('line', (line) => {
    savePath = path.join(outputPrefix, line);
    currentDirectory = path.join(outputPrefix, path.dirname(line));
    currentBaseName = path.basename(line);
    tsFullPath = path.join(outputPrefix, currentBaseName.replace(path.extname(currentBaseName), '.ts'));

    if (path.extname(line) === '.mp4') {
        m3u8Path = path.join(currentDirectory, getM3u8Name(currentBaseName));

        // Go go power rangers!
        runFFmpeg(renderFFmpegArgs(line, cdnUrlPrefix, m3u8Path, tsFullPath));
    }
});

lineReader.on('close', () => {
    process.stderr.write('end\n');
});
