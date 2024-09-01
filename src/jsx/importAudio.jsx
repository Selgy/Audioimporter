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
    var audioTrack = sequence.audioTracks[audioTrackIndex];
    
    for (var i = 0; i < audioTrack.clips.numItems; i++) {
        var clip = audioTrack.clips[i];
        var clipStartSeconds = clip.start.seconds;
        
        if (clip.name === audioItem.name && Math.abs(clipStartSeconds - playheadPositionSeconds) < 0.1) {
            return clip;
        }
    }
    
    return null;
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

        var project = app.project;
        if (!project) {
            return alert("Error: No active project");
        }
        debugLog += "Project found\n";

        var sequence = project.activeSequence;
        if (!sequence) {
            return alert("Error: No active sequence");
        }
        debugLog += "Sequence found\n";

        var importArray = [filePath];
        var importSuccessful = project.importFiles(importArray, 1, project.rootItem, 0);
        if (!importSuccessful) {
            return alert("Error: Import failed");
        }
        debugLog += "File imported\n";

        var importedItem = project.rootItem.children[project.rootItem.children.numItems - 1];
        if (!importedItem) {
            return alert("Error: Import item not found");
        }
        debugLog += "Imported item found\n";
        debugLog += "Imported item name: " + importedItem.name + "\n";
        debugLog += "Imported item type: " + importedItem.type + "\n";

        // Get and parse metadata
        var metadata = importedItem.getProjectMetadata();
        debugLog += "Metadata retrieved\n";
        debugLog += "Full Metadata: \n" + metadata + "\n";
        
        // Parse duration from metadata
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

                // Convert ticks to frames and then to seconds based on the frame rate
                var framesPerSecond = 30; // Your sequence frame rate
                var ticksPerFrame = 1602; // Example, assuming each frame has 1602 sub-ticks or whatever `09610` might represent
                var frames = ticks / ticksPerFrame;
                audioDuration = (hours * 3600) + (minutes * 60) + seconds + (frames / framesPerSecond);
            }
            debugLog += "Duration found in metadata: " + audioDuration + " seconds\n";
            alert("Audio duration: " + audioDuration.toFixed(6) + " seconds");
        } else {
            debugLog += "Duration not found in metadata. Full metadata:\n" + metadata + "\n";
            return alert("Error: Unable to determine audio duration from metadata\n\n" + debugLog);
        }

        var time = sequence.getPlayerPosition();
        if (!time) {
            return alert("Error: Could not get player position");
        }
        debugLog += "Player position: " + time.seconds + " seconds\n";

        // Ensure initialTrackIndex is a valid number
        initialTrackIndex = parseInt(initialTrackIndex);
        if (isNaN(initialTrackIndex) || initialTrackIndex < 1) {
            initialTrackIndex = 1;
        }
        debugLog += "Initial track index: " + initialTrackIndex + "\n";
        debugLog += "Total audio tracks: " + sequence.audioTracks.numTracks + "\n";

        var placementResult = findPlacementLocation(sequence, initialTrackIndex - 1, time, {seconds: audioDuration});
        debugLog += placementResult.debugLog;

        if (!placementResult.track || !placementResult.time) {
            return alert("Error: No available space found on any unlocked track\n\n" + debugLog);
        }

        var audioTrack = placementResult.track;
        var insertTime = placementResult.time;
        debugLog += "Inserting at " + insertTime.seconds.toFixed(2) + " seconds on track " + (audioTrack.index + 1) + "\n";

        var newClip = audioTrack.insertClip(importedItem, insertTime);
        if (!newClip) {
            return alert("Error: Failed to insert clip\n\n" + debugLog);
        }
        debugLog += "Clip inserted\n";

        var foundClip = findNewlyAddedClip(sequence, importedItem, insertTime.seconds, audioTrack.index);
        if (foundClip) {
            sequence.setSelection([foundClip]);
            setClipVolume(foundClip, volume);
            debugLog += "Clip volume set\n";
        } else {
            debugLog += "Warning: Newly added clip not found\n";
        }

        return alert("Success: Placed on track " + (audioTrack.index + 1) + " at " + insertTime.seconds.toFixed(2) + "s\n\n" + debugLog);

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