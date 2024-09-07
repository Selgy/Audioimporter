function dbToDecibel(x) {
    return Math.pow(10, (x - 15) / 20);
}

function setClipVolume(clip, volumeDb) {
    try {
        if (!clip) {
            return;
        }
        for (var i = 0; i < clip.components.numItems; i++) {
            var component = clip.components[i];
            if (component.displayName === "Volume") {
                for (var j = 0; j < component.properties.numItems; j++) {
                    var property = component.properties[j];
                    if (property.displayName === "Level") {
                        var volumeInDec = dbToDecibel(volumeDb); // Convert volumeDb to Premiere's internal scale
                        property.setValue(volumeInDec, true);
                        return;
                    }
                }
            }
        }
    } catch (e) {
        // Handle the error as needed
    }
}

function findNewlyAddedClip(sequence, audioItem, playheadPositionSeconds, audioTrackIndex) {
    var debugLog = "findNewlyAddedClip debug:\n";
    
    try {
        if (!sequence) {
            debugLog += "Error: sequence is undefined\n";
            throw new Error("sequence is undefined");
        }
        debugLog += "Sequence check passed\n";

        if (!sequence.audioTracks) {
            debugLog += "Error: sequence.audioTracks is undefined\n";
            throw new Error("sequence.audioTracks is undefined");
        }
        debugLog += "audioTracks check passed\n";

        debugLog += "Total audio tracks: " + sequence.audioTracks.numTracks + "\n";
        debugLog += "Attempting to access audio track at index: " + audioTrackIndex + "\n";

        if (audioTrackIndex === undefined || audioTrackIndex < 0 || audioTrackIndex >= sequence.audioTracks.numTracks) {
            debugLog += "Error: audioTrackIndex " + audioTrackIndex + " is out of bounds\n";
            throw new Error("audioTrackIndex is out of bounds");
        }

        var audioTrack = sequence.audioTracks[audioTrackIndex];
        if (!audioTrack) {
            debugLog += "Error: audioTrack at index " + audioTrackIndex + " is undefined\n";
            throw new Error("audioTrack is undefined");
        }
        debugLog += "audioTrack found\n";

        if (!audioTrack.clips) {
            debugLog += "Error: audioTrack.clips is undefined\n";
            throw new Error("audioTrack.clips is undefined");
        }
        debugLog += "clips check passed\n";

        debugLog += "Number of clips in audioTrack: " + audioTrack.clips.numItems + "\n";

        for (var i = 0; i < audioTrack.clips.numItems; i++) {
            var clip = audioTrack.clips[i];
            if (!clip) {
                debugLog += "Warning: clip at index " + i + " is undefined, skipping\n";
                continue;
            }
            
            var clipStartSeconds = clip.start.seconds;
            debugLog += "Checking clip " + i + ": name = " + clip.name + ", start time = " + clipStartSeconds + "\n";
            
            if (clip.name === audioItem.name && Math.abs(clipStartSeconds - playheadPositionSeconds) < 0.1) {
                debugLog += "Matching clip found\n";
                alert("Debug: Matching clip found in findNewlyAddedClip");
                return clip;
            }
        }
        
        debugLog += "No matching clip found\n";
        alert("Debug: No matching clip found in findNewlyAddedClip");
        return null;
    } catch (e) {
        debugLog += "Error in findNewlyAddedClip: " + e.toString() + "\n";
        alert("Debug Error in findNewlyAddedClip: " + e.toString() + "\n\n" + debugLog);
        throw e;
    }
}


function isSpaceFree(track, startTime, endTime) {
    for (var i = 0; i < track.clips.numItems; i++) {
        var clip = track.clips[i];
        if (clip.start.seconds < endTime.seconds && clip.end.seconds > startTime.seconds) {
            return false;
        }
    }
    return true;
}

function findSpaceOnTrack(track, startTime, clipDuration) {
    var endTime = new Time();
    endTime.seconds = startTime.seconds + clipDuration.seconds;

    for (var i = 0; i < track.clips.numItems; i++) {
        var clip = track.clips[i];
        if (clip.start.seconds >= endTime.seconds) {
            return startTime;
        }
        if (clip.end.seconds > startTime.seconds) {
            startTime.seconds = clip.end.seconds;
            endTime.seconds = startTime.seconds + clipDuration.seconds;
        }
    }
    return startTime;
}


function importAudioToTrack(filePath, initialTrackIndex, volume) {
    var debugLog = "Debug Log:\n";
    
    try {
        app.enableQE();
        debugLog += "QE enabled\n";
        alert("Debug 1: QE enabled");

        var project = app.project;
        if (!project) {
            return alert("Error: No active project");
        }
        debugLog += "Project found\n";
        alert("Debug 2: Project found");

        var sequence = project.activeSequence;
        if (!sequence) {
            return alert("Error: No active sequence");
        }
        debugLog += "Sequence found\n";
        alert("Debug 3: Sequence found");

        var frameRate = sequence.getSettings().videoFrameRate.seconds;
        var framesPerSecond = Math.round(1 / frameRate);
        debugLog += "Sequence frame rate: " + framesPerSecond + " fps\n";
        alert("Debug 4: Frame rate: " + framesPerSecond + " fps");

        var importArray = [filePath];
        var importSuccessful = project.importFiles(importArray, 1, project.rootItem, 0);
        if (!importSuccessful) {
            return alert("Error: Import failed");
        }
        debugLog += "File imported\n";
        alert("Debug 5: File imported");

        var importedItem = project.rootItem.children[project.rootItem.children.numItems - 1];
        if (!importedItem) {
            return alert("Error: Import item not found");
        }
        debugLog += "Imported item found\n";
        debugLog += "Imported item name: " + importedItem.name + "\n";
        debugLog += "Imported item type: " + importedItem.type + "\n";
        alert("Debug 6: Imported item found - Name: " + importedItem.name + ", Type: " + importedItem.type);

        var metadata = importedItem.getProjectMetadata();
        debugLog += "Metadata retrieved\n";
        alert("Debug 7: Metadata retrieved");
        
        var durationMatch = metadata.match(/<premierePrivateProjectMetaData:Column\.Intrinsic\.MediaDuration>(.*?)<\/premierePrivateProjectMetaData:Column\.Intrinsic\.MediaDuration>/);
        var audioDuration = 0;
        if (durationMatch && durationMatch[1]) {
            var durationString = durationMatch[1];
            var durationParts = durationString.split(':');
            if (durationParts.length === 4) {
                var hours = parseInt(durationParts[0]);
                var minutes = parseInt(durationParts[1]);
                var seconds = parseInt(durationParts[2]);
                var ticks = parseInt(durationParts[3]);

                var ticksPerFrame = 1602;
                var frames = ticks / ticksPerFrame;
                audioDuration = (hours * 3600) + (minutes * 60) + seconds + (frames / framesPerSecond);
            }
            debugLog += "Duration found in metadata: " + audioDuration + " seconds\n";
            alert("Debug 8: Duration found: " + audioDuration + " seconds");
        } else {
            debugLog += "Duration not found in metadata. Full metadata:\n" + metadata + "\n";
            return alert("Error: Unable to determine audio duration from metadata\n\n" + debugLog);
        }

        var time = sequence.getPlayerPosition();
        if (!time) {
            return alert("Error: Could not get player position");
        }
        debugLog += "Player position: " + time.seconds + " seconds\n";
        alert("Debug 9: Player position: " + time.seconds + " seconds");

        initialTrackIndex = parseInt(initialTrackIndex);
        if (isNaN(initialTrackIndex) || initialTrackIndex < 1) {
            initialTrackIndex = 1;
        }
        debugLog += "Initial track index: " + initialTrackIndex + "\n";
        debugLog += "Total audio tracks: " + sequence.audioTracks.numTracks + "\n";
        alert("Debug 10: Initial track index: " + initialTrackIndex + ", Total audio tracks: " + sequence.audioTracks.numTracks);

        var placementResult = findPlacementLocation(sequence, initialTrackIndex - 1, time, {seconds: audioDuration});
        debugLog += placementResult.debugLog;
        alert("Debug 11: Placement location found");

        if (!placementResult.track || !placementResult.time) {
            return alert("Error: No available space found on any unlocked track\n\n" + debugLog);
        }

        var audioTrack = placementResult.track;
        var insertTime = placementResult.time;
        var audioTrackIndex = audioTrack.index;  // Store the index explicitly
        debugLog += "Inserting at " + insertTime.seconds.toFixed(2) + " seconds on track " + (audioTrackIndex + 1) + "\n";
        alert("Debug 12: Inserting at " + insertTime.seconds.toFixed(2) + " seconds on track " + (audioTrackIndex + 1));

        var newClip;
        try {
            newClip = audioTrack.insertClip(importedItem, insertTime);
            if (!newClip) {
                throw new Error("insertClip returned null or undefined");
            }
            debugLog += "Clip inserted\n";
            alert("Debug 13: Clip inserted");
        } catch (insertError) {
            debugLog += "Error inserting clip: " + insertError.toString() + "\n";
            return alert("Error: Failed to insert clip - " + insertError.toString() + "\n\n" + debugLog);
        }

        // Attempt to recover track information if it becomes undefined
        if (audioTrack.index === undefined) {
            debugLog += "Warning: audioTrack.index became undefined after insertion\n";
            alert("Debug Warning: audioTrack.index became undefined after insertion");
            
            // Attempt to find the track by iterating through all audio tracks
            for (var i = 0; i < sequence.audioTracks.numTracks; i++) {
                var track = sequence.audioTracks[i];
                if (track.clips.numItems > 0 && track.clips[track.clips.numItems - 1].name === importedItem.name) {
                    audioTrackIndex = i;
                    audioTrack = track;
                    debugLog += "Recovered audio track index: " + audioTrackIndex + "\n";
                    alert("Debug: Recovered audio track index: " + audioTrackIndex);
                    break;
                }
            }
        } else {
            audioTrackIndex = audioTrack.index;
        }

        debugLog += "Audio track index after insertion: " + audioTrackIndex + "\n";
        alert("Debug 14: Audio track index after insertion: " + audioTrackIndex);

        if (audioTrackIndex === undefined || audioTrackIndex < 0 || audioTrackIndex >= sequence.audioTracks.numTracks) {
            debugLog += "Error: Invalid audioTrackIndex after insertion: " + audioTrackIndex + "\n";
            return alert("Error: Invalid audioTrackIndex after insertion: " + audioTrackIndex + "\n\n" + debugLog);
        }

        try {
            var foundClip = findNewlyAddedClip(sequence, importedItem, insertTime.seconds, audioTrackIndex);
            debugLog += "findNewlyAddedClip executed\n";
            if (foundClip) {
                debugLog += "Newly added clip found\n";
                alert("Debug 15: Newly added clip found");

                try {
                    sequence.setSelection([foundClip]);
                    debugLog += "Clip selection successful\n";
                    alert("Debug 16: Clip selection successful");
                } catch (selectionError) {
                    debugLog += "Error during clip selection: " + selectionError.toString() + "\n";
                    alert("Debug Error: Clip selection failed - " + selectionError.toString());
                }

                try {
                    setClipVolume(foundClip, volume);
                    debugLog += "Clip volume set to " + volume + " dB\n";
                    alert("Debug 17: Clip volume set to " + volume + " dB");
                } catch (volumeError) {
                    debugLog += "Error setting clip volume: " + volumeError.toString() + "\n";
                    alert("Debug Error: Setting clip volume failed - " + volumeError.toString());
                }
            } else {
                debugLog += "Warning: Newly added clip not found\n";
                alert("Debug Error: Newly added clip not found");
            }
        } catch (findClipError) {
            debugLog += "Error finding newly added clip: " + findClipError.toString() + "\n";
            alert("Debug Error: Finding newly added clip failed - " + findClipError.toString());
        }

        return alert("Process completed. Check debug log for details:\n\n" + debugLog);

    } catch (e) {
        return alert("Error in importAudioToTrack: " + e.toString() + "\n\nDebug Log:\n" + debugLog);
    }
}

function findPlacementLocation(sequence, startIndex, playheadTime, clipDuration) {
    var debugLog = "";
    for (var i = startIndex; i < sequence.audioTracks.numTracks; i++) {
        var track = sequence.audioTracks[i];
        debugLog += "Checking track " + (i + 1) + "\n";
        if (!track.isLocked()) {
            debugLog += "Track " + (i + 1) + " is unlocked\n";
            var space = findSpaceOnTrack(track, playheadTime, clipDuration);
            if (space) {
                debugLog += "Space found on track " + (i + 1) + " at " + space.seconds + " seconds\n";
                return { track: track, time: space, debugLog: debugLog };
            } else {
                debugLog += "No space found on track " + (i + 1) + "\n";
            }
        } else {
            debugLog += "Track " + (i + 1) + " is locked\n";
        }
    }
    debugLog += "No suitable space found on any track\n";
    return { track: null, time: null, debugLog: debugLog };
}

function findSpaceOnTrack(track, playheadTime, clipDuration) {
    var endTime = new Time();
    endTime.seconds = playheadTime.seconds + clipDuration.seconds;

    // Check if there's space at the playhead position
    if (isSpaceFree(track, playheadTime, endTime)) {
        return playheadTime;
    }

    // If not, find the next available space
    var lastClipEnd = playheadTime.seconds;
    for (var i = 0; i < track.clips.numItems; i++) {
        var clip = track.clips[i];
        if (clip.start.seconds > lastClipEnd + 0.01) { // 0.01 second buffer
            var spaceStart = new Time();
            spaceStart.seconds = lastClipEnd;
            if (isSpaceFree(track, spaceStart, endTime)) {
                return spaceStart;
            }
        }
        lastClipEnd = Math.max(lastClipEnd, clip.end.seconds);
    }

    // If no space found, return null
    return null;
}