function importAudioToTrack(filePath, initialTrackIndex) {
    try {
        // Get the active sequence
        var project = app.project;
        var sequence = project.activeSequence;
        if (!sequence) {
            $.writeln("No active sequence. Please open a sequence first.");
            return "No active sequence";
        }

        // Import the audio file
        var importArray = [filePath];
        var importSuccessful = project.importFiles(importArray, 1, project.rootItem, 0);
        if (!importSuccessful) {
            $.writeln("Failed to import the audio file: " + filePath);
            return "Import failed";
        }

        // Get the imported item from the project
        var importedItem = project.rootItem.children[project.rootItem.children.numItems - 1];
        if (!importedItem) {
            $.writeln("Imported item not found.");
            return "Import item not found";
        }

        // Get the current time position of the playhead in the sequence
        var time = sequence.getPlayerPosition();
        
        // Get the target audio track
        var audioTrack = sequence.audioTracks[initialTrackIndex - 1];
        if (!audioTrack) {
            $.writeln("Audio track " + initialTrackIndex + " not found.");
            return "Track not found";
        }

        // Insert the clip into the audio track
        var newClip = audioTrack.insertClip(importedItem, time);
        if (newClip) {
            $.writeln("Audio imported successfully on track A" + initialTrackIndex);
            return "Audio imported successfully on track A" + initialTrackIndex;
        } else {
            $.writeln("Failed to insert clip into track A" + initialTrackIndex);
            return "Insert failed";
        }

    } catch (e) {
        $.writeln("Error: " + e.toString());
        return "Error: " + e.toString();
    }
}

// Ensure the script is loaded successfully
$.writeln("importAudio.jsx loaded successfully.");
