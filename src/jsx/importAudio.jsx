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

function importAudioToTrack(filePath, initialTrackIndex, volume) {
    try {
        // Enable QE (Quality Engineering) mode
        app.enableQE();

        // Get the active sequence
        var project = app.project;
        var sequence = project.activeSequence;

        if (!sequence) {
            return "No active sequence";
        }

        // Import the audio file
        var importArray = [filePath];
        var importSuccessful = project.importFiles(importArray, 1, project.rootItem, 0);

        if (!importSuccessful) {
            return "Import failed";
        }

        // Get the imported item from the project
        var importedItem = project.rootItem.children[project.rootItem.children.numItems - 1];

        if (!importedItem) {
            return "Import item not found";
        }

        // Get the current time position of the playhead in the sequence
        var time = sequence.getPlayerPosition();
        var playheadPositionSeconds = time.seconds;

        // Get the target audio track
        var audioTrack = sequence.audioTracks[initialTrackIndex - 1];

        if (!audioTrack) {
            return "Track not found";
        }

        // Insert the clip into the audio track
        var newClip = audioTrack.insertClip(importedItem, time);

        // Find and select the newly added clip
        var foundClip = findNewlyAddedClip(sequence, importedItem, playheadPositionSeconds, initialTrackIndex - 1);
        if (foundClip) {
            sequence.setSelection([foundClip]);

            // Apply the specified volume to the selected clip
            setClipVolume(foundClip, volume);
        }

        return "Success";

    } catch (e) {
        return "Error: " + e.toString();
    }
}
