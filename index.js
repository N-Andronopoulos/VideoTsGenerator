#!/usr/local/bin/node

/**
 * Created by Nikola Andronopoulos on 09/01/2017.
 *
 * Created for Geotag Aeroview CDN, cause why Akamai?
 * @version 0.2.0
 */

'use strict';

// Fix errors if the script starts from another path
process.chdir(__dirname);

const path = require('path');
const fs = require('fs');
const url = require('url');
const execSync = require('child_process').execSync;
const ffmpeg = require('fluent-ffmpeg');
const m3u = require('m3u');
const async = require('async');

// Paths and arguments
const inputFile = process.argv[2];
const inputPrefix = process.argv[3] || '';
const outputPrefix = process.argv[4] || '';
const cdnUrlPrefix = process.argv[5] || 'http://localhost:3000/';
const m3u8Prefix = 'index', m3u8Postfix = '.m3u8';

const lineReader = require('line-reader');

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
-acodec copy \
-vbsf:v h264_mp4toannexb \
-start_number 0 \
-hls_time 10 \
-hls_list_size 0 \
-f hls \
-segment_list_flags hls \
-hls_allow_cache 1 \
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
        console.log('Path was not found, created.');
    } else {
        console.log('Path Exists.');
    }
};

setup();

/////////////////////////////////////////////////// MAGIC ///////////////////////////////////////////////////

//noinspection JSUnresolvedFunction
lineReader.eachLine(inputFile, (dirPath, last, nextLine) => {
    console.log(`Current line: ${dirPath}`);
    let inputDirPath = path.join(inputPrefix, dirPath);
    let files = fs.readdirSync(inputDirPath);

    // Master playlist reset...
    let writer = m3u.httpLiveStreamingWriter();
    writer.allowCache(true);

    let foundVideosInPath = false;

    async.forEachOfSeries(files, (file, idx, nextIteration) => {
        // Quick skip
        if (path.extname(file) !== '.mp4') {
            return nextIteration();
        }

        // I found some :D
        foundVideosInPath = true;

        // Oh noes variables
        let inputFilePath = path.join(inputDirPath, file);
        let cdnUrl = url.resolve(cdnUrlPrefix, path.join(dirPath, 'chunks')) + '/';
        let currentOutDir = path.join(outputPrefix, dirPath);
        let chunksDir = path.join(currentOutDir, 'chunks');
        let m3u8Path = path.join(currentOutDir, getM3u8Name(file));
        let tsFullPath = path.join(chunksDir, path.basename(file.replace(path.extname(file), '-%03d.ts')));

        // Dir creation skipping...
        if (!fs.existsSync(chunksDir)) {
            // Create the directories cause ffmpeg doesn't for some reason.
            execSync(`mkdir -p ${chunksDir}`);
        }

        // Le debug
        console.log(`InputFilePath: ${inputFilePath}`);
        console.log(`ChunksDir: ${chunksDir}`);
        console.log(`CDN Url: ${cdnUrl}`);
        console.log(`CurrentOutDir: ${currentOutDir}`);
        console.log(`m3u8Path: ${m3u8Path}`);
        console.log(`TSFullPath: ${tsFullPath}`);

        // Go go power rangers!
        runFFmpeg(renderFFmpegArgs(inputFilePath, cdnUrl, m3u8Path, tsFullPath));

        // Render the master playlist from original video data
        //noinspection JSUnresolvedFunction
        ffmpeg.ffprobe(inputFilePath, (err, metadata) => {
            //noinspection JSUnresolvedVariable
            let masterPlaylistOptions = {
                bandwidth: metadata.format.bit_rate,
                programId: 1,
                codecs: ['avc1.66.30', 'mp4a.40.5'],
                resolution: metadata.streams[0].coded_width + 'x' + metadata.streams[0].coded_height
            };
            writer.playlist(url.resolve(url.resolve(cdnUrlPrefix, path.join(dirPath)) + '/', path.basename(m3u8Path)), masterPlaylistOptions);
            nextIteration();
        });
    }, (error) => {
        if (error) {
            throw error;
        }
        // Check for empty list
        if (foundVideosInPath) {
            // Write the damn master playlist...
            let currentOutDir = path.join(outputPrefix, dirPath);
            fs.writeFileSync(path.join(currentOutDir, 'master.m3u8'), writer.toString());
            console.log('Playlist:\n', writer.toString(), '\n##############################################\n');
        }

        // You did?
        foundVideosInPath = false;
        // Next!
        nextLine();
    });
});
