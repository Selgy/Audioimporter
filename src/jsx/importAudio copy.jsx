function applyPitchShifterToSelected() {
    app.enableQE(); // Enable QE DOM

    var sequence = app.project.activeSequence;

    if (!sequence) {
        alert("No active sequence found.");
        return;
    }

    // Get selected clips using the regular DOM
    var selectedClips = sequence.getSelection();

    if (selectedClips.length === 0) {
        alert("No clips selected.");
        return;
    }

    // Iterate over the selected clips
    var addedCount = 0;
    for (var i = 0; i < selectedClips.length; i++) {
        var selectedClip = selectedClips[i];
        var startTime = selectedClip.start.ticks; // Start time of the selected clip
        var endTime = selectedClip.end.ticks; // End time of the selected clip

        // Match with QE DOM clips by checking start and end times
        var sequenceQE = qe.project.getActiveSequence();

        for (var j = 0; j < sequenceQE.numAudioTracks; j++) {
            var audioTrack = sequenceQE.getAudioTrackAt(j);

            for (var k = 0; k < audioTrack.numItems; k++) {
                var clipQE = audioTrack.getItemAt(k);

                if (clipQE.start.ticks === startTime && clipQE.end.ticks === endTime) {
                    // Check if Pitch Shifter effect is already applied
                    var pitchShifterExists = false;

                    for (var l = 0; l < clipQE.numComponents; l++) {
                        var effect = clipQE.getComponentAt(l);
                        if (effect.name === "Pitch Shifter") {
                            pitchShifterExists = true;
                            break;
                        }
                    }

                    // Apply Pitch Shifter if it's not already applied
                    if (!pitchShifterExists) {
                        try {
                            clipQE.addAudioEffect(qe.project.getAudioEffectByName("Pitch Shifter"));
                            addedCount++;
                        } catch (error) {
                            alert("Error adding Pitch Shifter to clip: " + error.toString());
                        }
                    }
                }
            }
        }
    }

    if (addedCount > 0) {
        alert("Pitch Shifter added to " + addedCount + " selected audio clip(s).");
    } else {
        alert("No Pitch Shifter added. All selected clips already have the effect or there was an issue matching clips.");
    }
}

// Run the function
applyPitchShifterToSelected();
