const images = {
    receptor: [
        new Image(80, 80),
        new Image(80, 80),
    ],
    notes: [
        new Image(80, 80),
        new Image(80, 80)
    ],
    judge: [
        new Image(),
        new Image(),
        new Image(),
        new Image(),
        new Image(),
        new Image(),
    ]
}
images.receptor[0].src = "/res/img/note/normal/ReceptorOff.png";
images.receptor[1].src = "/res/img/note/normal/ReceptorOn.png";
images.notes   [0].src = "/res/img/note/normal/Note0.png";
images.notes   [1].src = "/res/img/note/normal/Note1.png";
images.judge   [0].src = "/res/img/judge/EXCELLENT.png";
images.judge   [1].src = "/res/img/judge/AMAZING.png";
images.judge   [2].src = "/res/img/judge/GREAT.png";
images.judge   [3].src = "/res/img/judge/OKAY.png";
images.judge   [4].src = "/res/img/judge/POOR.png";
images.judge   [5].src = "/res/img/judge/MISS.png";

const urlParams = new URLSearchParams(window.location.search);
const song = urlParams.get("song");
const chart = urlParams.get("chart");

const noteHeightHalf = 40;
const PI200 = Math.PI*2;
const PI50 = Math.PI/2;

let laneKeys = ['KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL']; // default values, overriden by settings
const judgeColors = [
    [139, 255, 222],
    [97, 178, 255],
    [255, 194, 97],
    [97, 255, 97],
    [186, 97, 255],
    [255, 97, 97],
];

const JUDGES = {
    EX: 0,
    AM: 1,
    GR: 2,
    OK: 3,
    PR: 4,
    MS: 5,
}

const timingWindows = [ // close to StepMania J1
    35,
    70,
    105,
    175,
    280,
];

const scoreValues = [10, 9, 7, 5, 0, 0];

const readyTime = 2000;

$d.onLoad(function(event) {
    console.log("DOM loaded.");

    let fpsCounter = $object.fromID("fps");

    const loadingDialog = $get1("dialog");
    loadingDialog.showModal();

    const loadingProgress = $get1("#loadingprogress");
    const startSongButton = $get1("#startsong");

    let laneBombs = [ // the cool bomb effects when you hit a note
        {time: 0, judge: undefined},
        {time: 0, judge: undefined},
        {time: 0, judge: undefined},
        {time: 0, judge: undefined},
        {time: 0, judge: undefined},
        {time: 0, judge: undefined},
    ];

    let lastJudge = {
        judge: undefined,
        time: 0,
        timing: 0,
    };
    let judgeCounts = [0, 0, 0, 0, 0, 0];
    const comboBreaks = () => judgeCounts[JUDGES.PR] + judgeCounts[JUDGES.MS];
    let combo = 0;
    let worstJudgeSinceComboStart = JUDGES.EX;
    let score = 0;
    let maxScore = 0;

    // creating a rhythm track with BPM changes
    let songData = {};
    let music = new Audio();
    let offset = -0.080;
    fetch(`/res/songs/${song}/meta.json`)
        .then((response) => response.json())
        .then((json) => {
            loadingProgress.value = 1;

            console.log(json);
            songData = json;

            document.title = `${songData.artist} - ${songData.title}` + (songData.subtitle !== '' ?  ` (${songData.subtitle})` : '')

            music.src = `/res/songs/${song}/${songData.song}`;
            $get1("body").style.backgroundImage = `url('/res/songs/${song}/${songData.background}')`;

            offset = songData.offset;
        });
    let rhythm;
    let musicStartTime = 0;
    let musicTime = musicStartTime;
    let musicBeat = musicTime;

    let notes = [
        [],
        [],
        [],
        [],
        [],
        [],
    ]
    let nextNote = [0, 0, 0, 0, 0, 0];

    music.addEventListener("canplaythrough", function(event) {
        loadingProgress.value = 2;
        startSongButton.disabled = false;

        rhythm = new RhythmTracker(music.duration, songData.BPM["0"]);
        const sortedKeys = Object.keys(songData.BPM).sort((a, b) => parseFloat(a) > parseFloat(b));
        for(const key of sortedKeys) {
            if(key === 0) continue;
            const value = songData.BPM[key];
            console.log(key, value);
            const beat = parseFloat(key);
            rhythm.changeBPM(beat, value);
        }
        console.log(rhythm.timingSegments)
        /* rhythm.changeBPM(32, 92.960);
        rhythm.changeBPM(83.5, 80.000);
        rhythm.changeBPM(84, 65.000);
        rhythm.changeBPM(84.5, 39.800);
        rhythm.changeBPM(85, 95.500);
        rhythm.changeBPM(86, 191.000); */
        rhythm.changeScroll(1, 2);

        for(let i = 0; i < notes.length; i++) {
            for(let note of notes[i]) {
                note.time = rhythm.getTimeFromBeat(note.beat);
                maxScore += scoreValues[JUDGES.EX];
            }
        }

        loadingProgress.value = 2;
        //for(let i = 0; i <= rhythm.timingSegments[rhythm.timingSegments.length - 1].end.beat; i++)
            //console.log(i, rhythm.getPointY(rhythm.getTimeFromBeat(i)));
    });
    
    startSongButton.addEventListener('click', function(event) {
        loadingDialog.close();
        musicStartTime = performance.now() + readyTime;
        setTimeout(() => music.play(), readyTime);
    });

    for(let i = 0; i < 1024; i++) {
        notes[Math.round(Math.random()*2)].push({
            type: "tap",
            beat: i,
        });
        notes[Math.round(Math.random()*2) + 3].push({
            type: "tap",
            beat: i + 1/2,
        });
    }

    function hitNote(lane) {
        const note = notes[lane][nextNote[lane]];
        // < 0 if early, > 0 if late, 0 if neither
        const noteJudgeTime = (musicTime - note.time)*1000;
        const noteJudgeTimeAbs = Math.abs(noteJudgeTime);

        function register(j) {
            nextNote[lane]++;
            lastJudge = {
                judge: j,
                time: musicTime,
                timing: noteJudgeTime
            };
            judgeCounts[j]++;
            laneBombs[lane] = {
                judge: j,
                time: musicTime,
            };
            score += scoreValues[j];
            if(j >= JUDGES.PR) {
                combo = 0;
                worstJudgeSinceComboStart = JUDGES.EX; 
            } else {
                combo++;
                if(j > worstJudgeSinceComboStart)
                    worstJudgeSinceComboStart = j;
            }
        }

        for(let i = 0; i < timingWindows.length; i++)
            if(noteJudgeTimeAbs <= timingWindows[i]) { // player has hit the note
                register(i);
                break;
            }

        if(noteJudgeTime > timingWindows[JUDGES.PR]) register(JUDGES.MS);
    }

    // registering judge mechanisms
    for(let i = 0; i < laneKeys.length; i++)
        $keyboard.onPress(laneKeys[i], () => hitNote(i));

    let laneRender = $canvas.fromID("lanes");

    function resizeCanvas() {
        laneRender.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);

    // VISUAL CONSTANTS
    const judgeLineY = 100;
    const judgeLineWiggle = 2;
    const speed = 2000; // px/sec | px/beat
    const speedMode = 'sec'; // sec | beat
    const getDY = (time) => speed*((speedMode === 'sec') ? (time - musicTime) : (rhythm.getBeatFromTime(time) - musicBeat))
    
    // UPDATE LOOP
    let updateLoop = $update.add(function(dt) {
        let visualJudgeLineY = window.innerHeight - judgeLineY;
        let noteCenterJudgeLineY = visualJudgeLineY - noteHeightHalf;
        if(rhythm) {
            // GAME LOOP
            musicTime = offset - readyTime;
            if(musicStartTime != 0) {
                musicTime = (performance.now() - musicStartTime)/1000 + offset;
            }
            if(musicTime >= 0) {
                musicBeat = rhythm.getBeatFromTime(musicTime);
            } else {
                musicBeat = rhythm.timingSegments[0].BPS*musicTime;
            }

            //console.log(musicBeat);

            //console.log(getDY(musicTime-1))

            // notes cleanup
            for(let i = 0; i < notes.length; i++) { // lane
                const note = notes[i][nextNote[i]];
                if((note.time - musicTime)*1000 < -timingWindows[JUDGES.PR])
                    hitNote(i);
            }
            
            // RENDER
            fpsCounter.innerText = `${1000/dt} FPS`;
            fpsCounter.x = 0;
            fpsCounter.y = 0;

            let camY = rhythm.getPointY(musicTime);
            
            laneRender.clear();
            laneRender.fillStyle = RGB(0, 0, 0);
            laneRender.rect("fill", 0, 0, laneRender.width, window.innerHeight);

            // lanes
            laneRender.fillStyle = RGB(32, 32, 32);
            for(let i = 1; i < 6; i++)
                laneRender.rect("fill", i*100-1, 0, 2, window.innerHeight)
            // receptors
            for(let i = 0; i < 6; i++) {
                let image = 0;
                if($keyboard.isDown(laneKeys[i])) image = 1; //laneBombs[i] = {judge: Math.round(Math.random()*5), time: musicTime}
                laneRender.image(images.receptor[image], i*100 + 10, noteCenterJudgeLineY + judgeLineWiggle*Math.sin(musicBeat*Math.PI));
            }

            // timing segment start (usually a BPM change)
            laneRender.fillStyle = RGB(255, 255, 0);
            for(let i = 1; i < rhythm.timingSegments.length; i++) {
                let segment = rhythm.timingSegments[i];
                laneRender.rect("fill", 0, visualJudgeLineY - 2 - getDY(segment.start.time), laneRender.width, 4);
            }

            // beat line
            for(let i = 0; i <= rhythm.timingSegments[rhythm.timingSegments.length - 1].end.beat; i++) {
                let approach = Math.max((musicBeat - i)/2 + 1, 0);
                laneRender.fillStyle = RGBA(128, 128, 128, approach);
                laneRender.rect("fill", 0, visualJudgeLineY - 1 - getDY(rhythm.getTimeFromBeat(i)), laneRender.width, 2);
            }

            // notes
            for(let i = 0; i < notes.length; i++) {
                for(let j = 0; j < notes[i].length; j++) {
                    let note = notes[i][j];
                    let y = getDY(note.time);
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
                if(musicTime - bomb.time < 0.2 && bomb.judge !== undefined && bomb.judge < JUDGES.MS) {
                    let A = Math.min((1-(musicTime - bomb.time)*5), 1)**2;
                    let [R, G, B] = judgeColors[bomb.judge];
                    laneRender.lineWidth = 40*A;
                    laneRender.beginPath();
                    laneRender.strokeStyle = RGBA(R, G, B, A);
                    laneRender.arc('stroke', i*100 + 10 + noteHeightHalf, visualJudgeLineY, noteHeightHalf - 20*A + 10*(1-A), 0, PI200, false);
                    laneRender.closePath();
                }
            }

            // UI
            // combo
            if(combo > 0) {
                let fontSize = 40;
                if(musicTime - lastJudge.time < 0.2) {
                    let A = Math.min((1-(musicTime - lastJudge.time)*5), 1)**2;
                    fontSize += 16 * A;
                }
                
                const [R, G, B] = judgeColors[worstJudgeSinceComboStart];

                laneRender.fillStyle = RGB(R, G, B);
                laneRender.print('fill', combo, laneRender.width/2, window.innerHeight/2+2*(fontSize/40), laneRender.width, `${fontSize}px Inter black`, "center", "middle");
                laneRender.fillStyle = RGB(255, 255, 255);
                laneRender.print('fill', combo, laneRender.width/2, window.innerHeight/2, laneRender.width, `${fontSize}px Inter black`, "center", "middle");
            }

            // last judge
            if(lastJudge.judge !== undefined && musicTime - lastJudge.time < 1) {
                const image = images.judge[lastJudge.judge];

                let judgeOffset = 0;
                if(musicTime - lastJudge.time < 0.2) {
                    const A = Math.min((1-(musicTime - lastJudge.time)*5), 1)**2;
                    judgeOffset = 8 * A;
                }

                laneRender.image(image, laneRender.width/2-image.width/2, window.innerHeight/2-image.height/2-40-judgeOffset)
            }

            // timing bar
            laneRender.fillStyle = RGBA(256, 256, 256, 0.5)
            laneRender.rect('fill', laneRender.width/2-117, window.innerHeight/2 + 66, 234, 1)
            for(let i = 0; i < timingWindows.length; i++) {
                const timingWindow = timingWindows[i];
                const [R, G, B] = judgeColors[i];
                laneRender.fillStyle = RGB(R, G, B);
                laneRender.rect('fill', laneRender.width/2+117*(timingWindow/timingWindows[JUDGES.PR]), window.innerHeight/2 + 61, 1, 5)
                laneRender.rect('fill', laneRender.width/2-117*(timingWindow/timingWindows[JUDGES.PR]), window.innerHeight/2 + 61, 1, 5)
            }
            if(lastJudge.judge !== undefined) {
                const [R, G, B] = judgeColors[lastJudge.judge];
                laneRender.fillStyle = RGB(R, G, B);
                laneRender.rect('fill', laneRender.width/2, window.innerHeight/2 + 56, 117*(lastJudge.timing/timingWindows[JUDGES.PR]), 10)
            }
        }
    });
    resizeCanvas();
    $update.start();
});