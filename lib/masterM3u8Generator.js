/**
 * Created by Nikolas Andronopoulos on 1/13/17.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const ffmpeg = require('fluent-ffmpeg');
const m3u = require('m3u');
const async = require('async');

/**
 * Custom object definition for the generateFiles's argument
 *
 * @typedef {Object} CustomObj
 * @property {String} videoFile
 * @property {String} outputPath
 * @property {String} playlistPath
 * @property {String} url
 */

/**
 * Render a master mu8 with all the resolutions.
 *
 * @param dirSet{[CustomObj]} A Set of the directories which have m3u8 index files.
 */
const generateFiles = (dirSet) => {
    let writer, masterPlaylistOptions = {
        bandwidth: null,
        programId: 1,
        codecs: ['avc1.66.30', 'mp4a.40.5'],
        resolution: null
    };

    writer = m3u.httpLiveStreamingWriter();
    writer.allowCache(true);

    async.forEachOfSeries(dirSet, (customObj, idx, done) => {
        // Render the master playlist from original video data
        //noinspection JSUnresolvedFunction
        ffmpeg.ffprobe(customObj.videoFile, (err, metadata) => {
            if (!metadata) {
                masterPlaylistOptions.bandwidth = 100000;
                masterPlaylistOptions.resolution = '1920x1080';
            } else {
                //noinspection JSUnresolvedVariable
                masterPlaylistOptions.bandwidth = metadata.format.bit_rate;
                //noinspection JSUnresolvedVariable
                masterPlaylistOptions.resolution = metadata.streams[0].coded_width + 'x' + metadata.streams[0].coded_height;
            }

            writer.playlist(url.resolve(customObj.url, path.basename(customObj.playlistPath)), masterPlaylistOptions);

            // Write to file
            if (idx + 1 > dirSet.length - 1 || dirSet[idx + 1].outputPath !== customObj.outputPath) {
                try {
                    fs.writeFileSync(path.join(customObj.outputPath, 'master.m3u8'), writer.toString());
                } catch (err) {
                    if (err.code !== 'ENOENT') {
                        // the argument in done is always an error
                        done(err);
                        //throw err;
                    }
                }
                console.log("Playlist:\n", writer.toString(), '\n##############################################\n');
                writer = m3u.httpLiveStreamingWriter();
                writer.allowCache(true);
            }
            // all good, mone to next iteration
            done();
        });
    });

};

module.exports = {
    generateFiles
};

let test = [{
    videoFile: './00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/TURKEY_20-03_1000k.mp4',
    outputPath: './output/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3',
    playlistPath: './output/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/index1000k.m3u8',
    url: 'http://localhost:3000/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/'
}, {
    videoFile: './00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/TURKEY_20-03_1400k.mp4',
    outputPath: './output/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3',
    playlistPath: './output/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/index1400k.m3u8',
    url: 'http://localhost:3000/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/'
}, {
    videoFile: './00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/TURKEY_20-03_2500k.mp4',
    outputPath: './output/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3',
    playlistPath: './output/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/index2500k.m3u8',
    url: 'http://localhost:3000/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/'
}, {
    videoFile: './00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/TURKEY_20-03_450k.mp4',
    outputPath: './output/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3',
    playlistPath: './output/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/index450k.m3u8',
    url: 'http://localhost:3000/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/'
}, {
    videoFile: './00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/TURKEY_20-03_700k.mp4',
    outputPath: './output/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3',
    playlistPath: './output/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/index700k.m3u8',
    url: 'http://localhost:3000/00/a4/00a40cbf-8d3e-4a45-a5d8-f633a71350b3/'
}, {
    videoFile: './00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/STN4_00010-Mercalli_1_1_700k.mp4',
    outputPath: './output/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3',
    playlistPath: './output/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/index700k.m3u8',
    url: 'http://localhost:3000/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/'
}, {
    videoFile: './00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/STN4_00010-Mercalli_1_1_2500k.mp4',
    outputPath: './output/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3',
    playlistPath: './output/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/index2500k.m3u8',
    url: 'http://localhost:3000/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/'
}, {
    videoFile: './00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/STN4_00010-Mercalli_1_1_1400k.mp4',
    outputPath: './output/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3',
    playlistPath: './output/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/index1400k.m3u8',
    url: 'http://localhost:3000/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/'
}, {
    videoFile: './00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/STN4_00010-Mercalli_1_1_1000k.mp4',
    outputPath: './output/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3',
    playlistPath: './output/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/index1000k.m3u8',
    url: 'http://localhost:3000/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/'
}, {
    videoFile: './00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/STN4_00010-Mercalli_1_1_450k.mp4',
    outputPath: './output/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3',
    playlistPath: './output/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/index450k.m3u8',
    url: 'http://localhost:3000/00/e9/00e9f95b-2aa7-40a7-a62c-749c3163dad3/'
}, {
    videoFile: './00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/CUSTOM_560-01_450k.mp4',
    outputPath: './output/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa',
    playlistPath: './output/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/index450k.m3u8',
    url: 'http://localhost:3000/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/'
}, {
    videoFile: './00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/CUSTOM_560-01_1000k.mp4',
    outputPath: './output/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa',
    playlistPath: './output/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/index1000k.m3u8',
    url: 'http://localhost:3000/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/'
}, {
    videoFile: './00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/CUSTOM_560-01_1400k.mp4',
    outputPath: './output/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa',
    playlistPath: './output/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/index1400k.m3u8',
    url: 'http://localhost:3000/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/'
}, {
    videoFile: './00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/CUSTOM_560-01_2500k.mp4',
    outputPath: './output/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa',
    playlistPath: './output/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/index2500k.m3u8',
    url: 'http://localhost:3000/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/'
}, {
    videoFile: './00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/CUSTOM_560-01_700k.mp4',
    outputPath: './output/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa',
    playlistPath: './output/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/index700k.m3u8',
    url: 'http://localhost:3000/00/c9/00c92021-9be8-48b9-b36f-3b8058d4e5fa/'
}];

generateFiles(test);