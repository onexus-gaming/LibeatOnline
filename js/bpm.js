function isBeatInSegment(beat, segment) {
    return (segment.start.beat <= beat) && (beat <= segment.end.beat);
}

function isTimeInSegment(time, segment) {
    return (segment.start.time <= time) && (time <= segment.end.time);
}

class RhythmTracker {
    constructor(length, initialBPM) {
        this.timingSegments = [{
            BPM: initialBPM,
            BPS: initialBPM/60,
            SPB: 60/initialBPM,
            MSPB: 60000/initialBPM,
            start: {
                beat: 0,
                time: 0,
            },
            end: {
                beat: length/60*initialBPM,
                time: length,
            }
        }];
        this.scrollSegments = [{
            start: {
                beat: 0,
                time: 0,
            },
            end: {
                beat: length/60*initialBPM,
                time: length,
            },
            speed: 1,
        }];
        this.length = length;
    }

    changeBPM(start, BPM) {
        let previousSegment = this.timingSegments[this.timingSegments.length - 1];
        previousSegment.end.beat = start;
        previousSegment.end.time = previousSegment.start.time + (previousSegment.end.beat - previousSegment.start.beat)*previousSegment.SPB;

        this.timingSegments.push({
            BPM: BPM,
            BPS: BPM/60,
            SPB: 60/BPM,
            MSPB: 60000/BPM,
            start: {
                beat: start,
                time: previousSegment.end.time,
            },
            end: {
                beat: start + (this.length - previousSegment.end.time)*BPM/60,
                time: this.length,
            }
        });
    }

    getTimeFromBeat(beat) {
        for(let i = 0; i < this.timingSegments.length; i++) {
            let segment = this.timingSegments[i];
            if(!isBeatInSegment(beat, segment)) continue;

            let elapsedBeatsInSegment = beat - segment.start.beat;
            let elapsedTimeInSegment  = elapsedBeatsInSegment*segment.SPB;
            return segment.start.time + elapsedTimeInSegment;
        }
    }

    getBeatFromTime(time) {
        if(time < 0) return time*this.timingSegments[0].BPS

        for(let i = 0; i < this.timingSegments.length; i++) {
            let segment = this.timingSegments[i];
            //console.log(segment.BPM, isTimeInSegment(time, segment));
            if(!isTimeInSegment(time, segment)) continue;

            let elapsedTimeInSegment  = time - segment.start.time;
            let elapsedBeatsInSegment = elapsedTimeInSegment*segment.BPS;
            return segment.start.beat + elapsedBeatsInSegment;
        }
    }

    changeScroll(start, speed) {
        let previousSegment = this.scrollSegments[this.scrollSegments.length - 1];
        previousSegment.end.beat = start;
        previousSegment.end.time = this.getTimeFromBeat(start);

        this.scrollSegments.push({
            start: {
                beat: start,
                time: previousSegment.end.time,
            },
            end: {
                beat: this.getBeatFromTime(self.length),
                time: self.length,
            },
            speed: speed,
        });
    }

    getPointY(time) {
        let baseY = 0;
        for(let i = 0; i < this.scrollSegments.length; i++) {
            let segment = this.scrollSegments[i];
            //console.log(segment.BPM, isTimeInSegment(time, segment));
            //console.log(time, i, segment, !isTimeInSegment(time, segment));
            if(!isTimeInSegment(time, segment)) {
                baseY += (segment.end.time - segment.start.time)*segment.speed;
            } else {
                let elapsedTimeInSegment  = time - segment.start.time;
                let gainedYInSegment = elapsedTimeInSegment*segment.speed;
            
                return baseY + gainedYInSegment;
            }
        }
    }
}