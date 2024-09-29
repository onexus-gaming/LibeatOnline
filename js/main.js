const images = {
    receptor: new Image(80, 80),
    notes: [
        new Image(80, 80),
        new Image(80, 80)
    ]
}
images.receptor.src = "/res/img/note/normal/Receptor.png";
images.notes[0].src = "/res/img/note/normal/Note0.png";
images.notes[1].src = "/res/img/note/normal/Note1.png";

const urlParams = new URLSearchParams(window.location.search);
const song = urlParams.get("song");
const chart = urlParams.get("chart");

let noteLanes = [];
for(let i = 0; i < 5; i++)
    noteLanes.push({
        notes: [],
        next: 0,
    });

$d.onLoad(function(event) {
    console.log("DOM loaded.");

    let disp = $object.fromID("disp");
    const loadingDialog = $get1("dialog");
    loadingDialog.showModal();
    const loadingProgress = $get1("#loadingprogress");
    const startSongButton = $get1("#startsong");

    // creating a rhythm track with BPM changes
    let music = new Audio("/res/songs/A/A.mp3");
    let rhythm;
    let musicStartTime = 0;
    music.addEventListener("canplaythrough", function(event) {
        loadingProgress.value = 2;
        startSongButton.disabled = false;

        rhythm = new RhythmTracker(music.duration, 92.930);
        rhythm.changeBPM(32, 92.960);
        rhythm.changeBPM(83.5, 80.000);
        rhythm.changeBPM(84, 65.000);
        rhythm.changeBPM(84.5, 39.800);
        rhythm.changeBPM(85, 95.500);
        rhythm.changeBPM(86, 191.000);
        rhythm.changeScroll(1, 2);
        //for(let i = 0; i <= rhythm.timingSegments[rhythm.timingSegments.length - 1].end.beat; i++)
            //console.log(i, rhythm.getPointY(rhythm.getTimeFromBeat(i)));
    });
    
    startSongButton.addEventListener('click', function(event) {
        loadingDialog.close();
        musicStartTime = performance.now();
        music.play();
    });

    let laneRender = $canvas.fromID("lanes");

    function resizeCanvas() {
        laneRender.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);

    let judgeLineY = 100;
    let judgeLineWiggle = 2;
    let speed = 1500;
    let offset = -0.080;
    
    let updateLoop = $update.add(function(dt) {
        if(rhythm) {
            let musicTime = offset;
            let musicBeat;
            if(musicTime >= 0) {
                musicBeat = rhythm.getBeatFromTime(musicTime);
            } else {
                musicBeat = 0;
            }
            if(musicStartTime != 0) {
                musicTime = (performance.now() - musicStartTime)/1000 + offset;
            }
            let camY = rhythm.getPointY(musicTime);

            disp.innerText = `${1000/dt} FPS`;
            disp.x = 0;
            disp.y = 0;

            laneRender.clear();
            laneRender.fillStyle = RGB(0, 0, 0);
            laneRender.rect("fill", 0, 0, laneRender.width, window.innerHeight);

            laneRender.fillStyle = RGB(32, 32, 32);
            for(let i = 1; i < 6; i++)
                laneRender.rect("fill", i*80-1, 0, 2, window.innerHeight)
            for(let i = 0; i < 6; i++)
                laneRender.image(images.receptor, i*80, window.innerHeight-40-judgeLineY+judgeLineWiggle*Math.sin(musicBeat*Math.PI));
            laneRender.fillStyle = RGB(255, 255, 0);
            for(let i = 0; i < rhythm.timingSegments.length; i++) {
                let segment = rhythm.timingSegments[i]
                laneRender.rect("fill", 0, window.innerHeight-judgeLineY-4-speed*(segment.start.time - musicTime), laneRender.width, 4);
            }
            laneRender.fillStyle = RGB(128, 128, 128);
            for(let i = 0; i <= rhythm.timingSegments[rhythm.timingSegments.length - 1].end.beat; i++) {
                laneRender.rect("fill", 0, window.innerHeight-judgeLineY-4-speed*(rhythm.getTimeFromBeat(i) - musicTime), laneRender.width, 4);
                if(i%2 == 0)
                    laneRender.image(images.notes[0], 0, window.innerHeight-40-judgeLineY-speed*(rhythm.getTimeFromBeat(i) - musicTime));
                else
                    laneRender.image(images.notes[1], 80, window.innerHeight-40-judgeLineY-speed*(rhythm.getTimeFromBeat(i) - musicTime));
            }
        }
    });
    resizeCanvas();
    $update.start();
});