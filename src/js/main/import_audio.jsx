function importAudio(filePath, trackIndex) {
    try {
        var project = app.project;
        var sequence = project.activeSequence;

        if (sequence) {
            var targetTrack = sequence.audioTracks[trackIndex - 1];
            if (targetTrack) {
                targetTrack.insertNewClip(filePath, 0);
                return "Audio Imported Successfully";
            } else {
                return "Track index out of bounds";
            }
        } else {
            return "No active sequence found";
        }
    } catch (e) {
        return "Error importing audio: " + e.toString();
    }
}
