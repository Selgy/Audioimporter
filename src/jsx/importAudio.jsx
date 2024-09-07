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


function importAudioToTrack(filePath, initialTrackIndex, volume, debugMode) {
    var debugLog = "Debug Log:\n";
    var debugAlerts = [];

    function addDebugMessage(message) {
        debugLog += message + "\n";
        if (debugMode) {
            debugAlerts.push(message);
        }
    }

    try {
        app.enableQE();
        addDebugMessage("Debug 1: QE enabled");

        var project = app.project;
        if (!project) {
            return alert("Error: No active project");
        }
        addDebugMessage("Debug 2: Project found");

        var sequence = project.activeSequence;
        if (!sequence) {
            return alert("Error: No active sequence");
        }
        addDebugMessage("Debug 3: Sequence found");

        var frameRate = sequence.getSettings().videoFrameRate.seconds;
        var framesPerSecond = Math.round(1 / frameRate);
        addDebugMessage("Debug 4: Frame rate: " + framesPerSecond + " fps");

        var importArray = [filePath];
        var importSuccessful = project.importFiles(importArray, 1, project.rootItem, 0);
        if (!importSuccessful) {
            return alert("Error: Import failed");
        }
        addDebugMessage("Debug 5: File imported");

        var importedItem = project.rootItem.children[project.rootItem.children.numItems - 1];
        if (!importedItem) {
            return alert("Error: Import item not found");
        }
        addDebugMessage("Debug 6: Imported item found - Name: " + importedItem.name + ", Type: " + importedItem.type);

        var metadata = importedItem.getProjectMetadata();
        addDebugMessage("Debug 7: Metadata retrieved");
        
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
            addDebugMessage("Debug 8: Duration found: " + audioDuration + " seconds");
        } else {
            debugLog += "Duration not found in metadata. Full metadata:\n" + metadata + "\n";
            return alert("Error: Unable to determine audio duration from metadata\n\n" + debugLog);
        }

        var time = sequence.getPlayerPosition();
        if (!time) {
            return alert("Error: Could not get player position");
        }
        addDebugMessage("Debug 9: Player position: " + time.seconds + " seconds");

        initialTrackIndex = parseInt(initialTrackIndex);
        if (isNaN(initialTrackIndex) || initialTrackIndex < 1) {
            initialTrackIndex = 1;
        }
        addDebugMessage("Debug 10: Initial track index: " + initialTrackIndex + ", Total audio tracks: " + sequence.audioTracks.numTracks);

        var placementResult = findPlacementLocation(sequence, initialTrackIndex - 1, time, {seconds: audioDuration});
        debugLog += placementResult.debugLog;
        addDebugMessage("Debug 11: Placement location found");

        if (!placementResult.track || !placementResult.time) {
            return alert("Error: No available space found on any unlocked track\n\n" + debugLog);
        }

        var audioTrack = placementResult.track;
        var insertTime = placementResult.time;
        var intendedTrackIndex = placementResult.trackIndex;
        
        addDebugMessage("Debug 12: Attempting to insert at " + insertTime.seconds.toFixed(2) + " seconds on intended track " + (intendedTrackIndex + 1));

        var newClip;
        try {
            newClip = audioTrack.insertClip(importedItem, insertTime);
            if (!newClip) {
                throw new Error("insertClip returned null or undefined");
            }
            addDebugMessage("Debug 13: Clip inserted");
        } catch (insertError) {
            debugLog += "Error inserting clip: " + insertError.toString() + "\n";
            return alert("Error: Failed to insert clip - " + insertError.toString() + "\n\n" + debugLog);
        }

        // Search for the newly added clip, starting from the intended track
        var finalAudioTrackIndex = intendedTrackIndex;
        var foundClip;
        for (var i = intendedTrackIndex; i < sequence.audioTracks.numTracks; i++) {
            var track = sequence.audioTracks[i];
            var lastClip = track.clips[track.clips.numItems - 1];
            if (lastClip && lastClip.name === importedItem.name && Math.abs(lastClip.start.seconds - insertTime.seconds) < 0.1) {
                finalAudioTrackIndex = i;
                foundClip = lastClip;
                addDebugMessage("Debug 14: Found newly inserted clip on track " + (finalAudioTrackIndex + 1));
                break;
            }
        }

        if (!foundClip) {
            debugLog += "Error: Unable to find the newly inserted clip on any track\n";
            return alert("Error: Unable to find the newly inserted clip\n\n" + debugLog);
        }

        addDebugMessage("Debug 15: Final audio track index: " + (finalAudioTrackIndex + 1));

        if (finalAudioTrackIndex !== intendedTrackIndex) {
            addDebugMessage("Warning: Clip was placed on track " + (finalAudioTrackIndex + 1) + " instead of intended track " + (intendedTrackIndex + 1));
        }

        try {
            sequence.setSelection([foundClip]);
            addDebugMessage("Debug 16: Clip selection successful");
        } catch (selectionError) {
            addDebugMessage("Debug Error: Clip selection failed - " + selectionError.toString());
        }

        try {
            setClipVolume(foundClip, volume);
            addDebugMessage("Debug 17: Clip volume set to " + volume + " dB");
        } catch (volumeError) {
            addDebugMessage("Debug Error: Setting clip volume failed - " + volumeError.toString());
        }

        if (debugMode) {
            alert(debugAlerts.join("\n"));
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
                return { track: track, time: space, trackIndex: i, debugLog: debugLog };
            } else {
                debugLog += "No space found on track " + (i + 1) + "\n";
            }
        } else {
            debugLog += "Track " + (i + 1) + " is locked\n";
        }
    }
    debugLog += "No suitable space found on any track\n";
    return { track: null, time: null, trackIndex: null, debugLog: debugLog };
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