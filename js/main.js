const images = {
    receptor: [
        new Image(80, 80),
        new Image(80, 80),
    ],
    notes: [
        new Image(80, 80),
        new Image(80, 80)
    ]
}
images.receptor[0].src = "/res/img/note/normal/ReceptorOff.png";
images.receptor[1].src = "/res/img/note/normal/ReceptorOn.png";
images.notes   [0].src = "/res/img/note/normal/Note0.png";
images.notes   [1].src = "/res/img/note/normal/Note1.png";

const urlParams = new URLSearchParams(window.location.search);
const song = urlParams.get("song");
const chart = urlParams.get("chart");

let noteLanes = [];
for(let i = 0; i < 5; i++)
    noteLanes.push({
        notes: [],
        next: 0,
    });

const noteHeightHalf = 40;
const PI2 = Math.PI*2;

$d.onLoad(function(event) {
    console.log("DOM loaded.");

    let disp = $object.fromID("disp");

    const loadingDialog = $get1("dialog");
    loadingDialog.showModal();

    const loadingProgress = $get1("#loadingprogress");
    const startSongButton = $get1("#startsong");

    let laneKeys = ['KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL'];
    let laneBombs = [
        {time: 0, judge: undefined},
        {time: 0, judge: undefined},
        {time: 0, judge: undefined},
        {time: 0, judge: undefined},
        {time: 0, judge: undefined},
        {time: 0, judge: undefined},
    ]; // the cool bomb effects when you hit a note

    // creating a rhythm track with BPM changes
    let songData = {};
    let music = new Audio();
    fetch('res/songs/A/meta.json')
        .then((response) => response.json())
        .then((json) => {
            console.log(json), songData = json;
            music.src = `/res/songs/A/${songData.song}`;
        });
    let rhythm;
    let musicStartTime = 0;
    let notes = [
        [{beat: 0, type: "tap"}, {beat: 0.25, type: "tap"}, {beat: 0.5, type: "tap"}, {beat: 0.75, type: "tap"}],
        [{beat: 1, type: "tap"}],
        [{beat: 2, type: "tap"}],
        [{beat: 3, type: "tap"}],
        [{beat: 4, type: "tap"}],
        [{beat: 5, type: "tap"}],
    ]
    let nextNote = [0, 0, 0, 0, 0, 0];

    for(let i = 0; i < notes.length; i++) {
        for(let j = 0; j < 1024; j += 2)
            notes[i].push({beat: j + Math.random() * 2, type: "tap"})
    }
    music.addEventListener("canplaythrough", function(event) {
        loadingProgress.value = 1;
        startSongButton.disabled = false;

        rhythm = new RhythmTracker(music.duration, 92.930);
        rhythm.changeBPM(32, 92.960);
        rhythm.changeBPM(83.5, 80.000);
        rhythm.changeBPM(84, 65.000);
        rhythm.changeBPM(84.5, 39.800);
        rhythm.changeBPM(85, 95.500);
        rhythm.changeBPM(86, 191.000);
        rhythm.changeScroll(1, 2);

        for(let i = 0; i < notes.length; i++) {
            for(let note of notes[i]) {
                note.time = rhythm.getTimeFromBeat(note.beat);
            }
        }

        loadingProgress.value = 2;
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
        let visualJudgeLineY = window.innerHeight - judgeLineY;
        let noteCenterJudgeLineY = visualJudgeLineY - noteHeightHalf;
        if(rhythm) {
            // GAME LOOP
            let musicTime = offset;
            let musicBeat;
            if(musicStartTime != 0) {
                musicTime = (performance.now() - musicStartTime)/1000 + offset;
            }
            if(musicTime >= 0) {
                musicBeat = rhythm.getBeatFromTime(musicTime);
            } else {
                musicBeat = 0;
            }
            let camY = rhythm.getPointY(musicTime);

            disp.innerText = `${1000/dt} FPS`;
            disp.x = 0;
            disp.y = 0;


            // RENDER
            laneRender.clear();
            laneRender.fillStyle = RGB(0, 0, 0);
            laneRender.rect("fill", 0, 0, laneRender.width, window.innerHeight);

            // lanes
            laneRender.fillStyle = RGB(32, 32, 32);
            for(let i = 1; i < 6; i++)
                laneRender.rect("fill", i*100-1, 0, 2, window.innerHeight)
            // receptors
            laneRender.fillStyle = RGB(255, 0, 0);
            laneRender.rect("fill", 0, window.innerHeight-judgeLineY, laneRender.width, 1);
            for(let i = 0; i < 6; i++) {
                let image = 0;
                if($keyboard.isDown(laneKeys[i])) {image = 1; laneBombs[i].time = musicTime};
                laneRender.image(images.receptor[image], i*100 + 10, noteCenterJudgeLineY + judgeLineWiggle*Math.sin(musicBeat*Math.PI));
            }

            // timing segment start (usually a BPM change)
            laneRender.fillStyle = RGB(255, 255, 0);
            for(let i = 1; i < rhythm.timingSegments.length; i++) {
                let segment = rhythm.timingSegments[i];
                laneRender.rect("fill", 0, visualJudgeLineY - 2 - speed*(segment.start.time - musicTime), laneRender.width, 4);
            }

            // beat line
            for(let i = 0; i <= rhythm.timingSegments[rhythm.timingSegments.length - 1].end.beat; i++) {
                let approach = Math.max((musicBeat - i)/2 + 1, 0);
                laneRender.fillStyle = RGBA(128, 128, 128, approach);
                laneRender.rect("fill", 0, visualJudgeLineY - 1 - speed*(rhythm.getTimeFromBeat(i) - musicTime), laneRender.width, 2);
            }

            // notes
            for(let i = 0; i < notes.length; i++) {
                for(let j = 0; j < notes[i].length; j++) {
                    let note = notes[i][j];
                    let y = speed*(note.time - musicTime);
                    if(y > window.innerHeight) continue;
                    //if(y < 0) y/=10;
                    let clr = (i < 3 ? i : i+1)%2;
                    if(j >= nextNote[i])
                        laneRender.image(images.notes[clr], i*100 + 10, noteCenterJudgeLineY - y);
                }
            }

            // bombs
            for(let i = 0; i < laneBombs.length; i++) {
                let bomb = laneBombs[i];
                if(musicTime - bomb.time < 0.2) {
                    let W = Math.min((1-(musicTime - bomb.time)*5), 1)**2;
                    laneRender.lineWidth = 40*W;
                    laneRender.beginPath();
                    laneRender.strokeStyle = RGBA(255, 255, 255, W);
                    laneRender.arc('stroke', i*100 + 10 + noteHeightHalf, visualJudgeLineY, noteHeightHalf - 20*W + 10*(1-W), 0, PI2, false);
                }
            }
        }
    });
    resizeCanvas();
    $update.start();
});