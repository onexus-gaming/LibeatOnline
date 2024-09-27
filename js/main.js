$d.onLoad(function(event) {
    console.log("DOM loaded.");

    let disp = $object.fromID("disp");

    let images = {
        receptor: new Image(80, 80),
        notes: [
            new Image(80, 80),
            new Image(80, 80)
        ]
    }
    images.receptor.src = '/res/img/note/normal/Receptor.png';
    images.notes[0].src = '/res/img/note/normal/Note0.png';
    images.notes[1].src = '/res/img/note/normal/Note1.png';

    // creating a rhythm track with BPM changes
    let music = new Audio('/res/songs/A/A.mp3');
    let rhythm;
    let musicStartTime = 0;
    music.addEventListener('canplaythrough', function(event) {
        rhythm = new RhythmTracker(music.duration, 92.930);
        rhythm.changeBPM(32, 92.960);
        rhythm.changeBPM(83.5, 80.000);
        rhythm.changeBPM(84, 65.000);
        rhythm.changeBPM(84.5, 39.800);
        rhythm.changeBPM(85, 95.500);
        rhythm.changeBPM(86, 191.000);
        rhythm.changeScroll(1, 2);
        for(let i = 0; i <= rhythm.timingSegments[rhythm.timingSegments.length - 1].end.beat; i++)
            console.log(i, rhythm.getPointY(rhythm.getTimeFromBeat(i)));
        musicStartTime = performance.now();
        music.play();
    });

    let lanes = $canvas.fromID("lanes");

    function resizeCanvas() {
        lanes.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);

    let judgeLineY = 100;
    let judgeLineWiggle = 2;
    let judgeLineThickness = 20;
    let speed = 1500;
    let offset = -0.080;
    
    let updateLoop = $update.add(function(dt) {
        if(rhythm) {
            let musicTime = (performance.now() - musicStartTime)/1000 + offset;
            let camY = rhythm.getPointY(musicTime);

            disp.innerText = `${1000/dt} FPS`;
            disp.x = 0;
            disp.y = 0;

            lanes.clear();
            lanes.fillStyle = RGB(0, 0, 0);
            lanes.rect("fill", 0, 0, lanes.width, window.innerHeight);

            lanes.fillStyle = RGB(32, 32, 32);
            for(let i = 1; i < 6; i++)
                lanes.rect("fill", i*80-1, 0, 2, window.innerHeight)
            for(let i = 0; i < 6; i++)
                lanes.image(images.receptor, i*80, window.innerHeight-40-judgeLineY+judgeLineWiggle*Math.sin(rhythm.getBeatFromTime(musicTime)*Math.PI));
            lanes.fillStyle = RGB(255, 255, 0);
            for(let i = 0; i < rhythm.timingSegments.length; i++) {
                let segment = rhythm.timingSegments[i]
                lanes.rect("fill", 0, window.innerHeight-judgeLineY-4-speed*(segment.start.time - musicTime), lanes.width, 4);
            }
            lanes.fillStyle = RGB(128, 128, 128);
            for(let i = 0; i <= rhythm.timingSegments[rhythm.timingSegments.length - 1].end.beat; i++) {
                lanes.rect("fill", 0, window.innerHeight-judgeLineY-4-speed*(rhythm.getTimeFromBeat(i) - musicTime), lanes.width, 4);
                if(i%2 == 0)
                    lanes.image(images.notes[0], 0, window.innerHeight-40-judgeLineY-speed*(rhythm.getTimeFromBeat(i) - musicTime));
                else
                    lanes.image(images.notes[1], 80, window.innerHeight-40-judgeLineY-speed*(rhythm.getTimeFromBeat(i) - musicTime));
            }
        }
    });
    resizeCanvas();
    $update.start();
});