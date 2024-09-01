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


function isSpaceAvailableOnTrack(track, time) {
    for (var i = 0; i < track.clips.numItems; i++) {
        var clip = track.clips[i];
        if (clip.start.seconds <= time.seconds && clip.end.seconds > time.seconds) {
            return false;
        }
    }
    return true;
}

function findFirstAvailableTrack(sequence, startIndex, time) {
    for (var i = startIndex; i < sequence.audioTracks.numTracks; i++) {
        var track = sequence.audioTracks[i];
        if (!track.isLocked()) {
            var spaceAvailable = isSpaceAvailableOnTrack(track, time);
            if (spaceAvailable) {
                return track;
            }
        }
    }
    return null;
}


function importAudioToTrack(filePath, initialTrackIndex, volume) {
    try {
        app.enableQE();

        var project = app.project;
        var sequence = project.activeSequence;

        if (!sequence) {
            return "No active sequence";
        }

        var importArray = [filePath];
        var importSuccessful = project.importFiles(importArray, 1, project.rootItem, 0);

        if (!importSuccessful) {
            return "Import failed";
        }

        var importedItem = project.rootItem.children[project.rootItem.children.numItems - 1];

        if (!importedItem) {
            return "Import item not found";
        }

        var time = sequence.getPlayerPosition();
        
        // Find the first available unlocked track starting from the initial track
        var audioTrack = findFirstAvailableTrack(sequence, initialTrackIndex - 1, time);

        if (!audioTrack) {
            return "No available unlocked tracks found";
        }

        // Insert the clip at the determined position
        var newClip = audioTrack.insertClip(importedItem, time);

        // Find and select the newly added clip
        var foundClip = findNewlyAddedClip(sequence, importedItem, time.seconds, audioTrack.index);
        if (foundClip) {
            sequence.setSelection([foundClip]);
            setClipVolume(foundClip, volume);
        }

        return "Success: Placed on track " + (audioTrack.index + 1);

    } catch (e) {
        return "Error: " + e.toString();
    }
}

function findNextAvailableSpace(audioTrack, startTime) {
    var clips = audioTrack.clips;
    var currentTime = startTime;

    for (var i = 0; i < clips.numItems; i++) {
        var clip = clips[i];
        if (clip.start.seconds >= currentTime.seconds) {
            return currentTime;
        }
        currentTime = clip.end;
    }

    return currentTime;
}