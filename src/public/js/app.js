const socket = io()

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const micSelect = document.getElementById("mics");

let myStream;
let muted = false;
let cameraOff = false;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMics() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        console.log(devices);
        const mics = devices.filter((device) => device.kind === "audioinput");
        const currentMic = myStream.getAudioTracks()[0];
        mics.forEach((mic) => {
            const option = document.createElement("option");
            option.value = mic.deviceId;
            option.innerText = mic.label;
            if(currentMic.label == mic.label) {
                option.selected = true;
            }
            micSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId, type) {
    const initialConstraints = {
        audio: true,
        video: {facingMode: "user"}
    };

    if(type === "camera") {
        const cameraConstraints = {
            audio: true,
            video: {deviceId: {exact: deviceId}}
        };
        try {
            // api 메서드
            myStream= await navigator.mediaDevices.getUserMedia(
                deviceId ? cameraConstraints : initialConstraints
            );
            // console.log(myStream);
            myFace.srcObject = myStream;
            if(!deviceId){
                await getCameras();
            }
        } catch(e) {
            console.log(e);
        }
    }

    else if(type === "mic") {
        const micConstraints = {
            audio: {deviceId: {exact: deviceId}},
            video: true
        };
        try {
            // api 메서드
            myStream= await navigator.mediaDevices.getUserMedia(
                deviceId ? micConstraints : initialConstraints
            );
            // console.log(myStream);
            myFace.srcObject = myStream;
            if(!deviceId){
                await getMics();
            }
        } catch(e) {
            console.log(e);
        }
    }
    else {
        try {
            myStream= await navigator.mediaDevices.getUserMedia(
                initialConstraints
            );
            myFace.srcObject = myStream;
            await getCameras();
            await getMics();
        } catch(e) {
            console.log(e);
        }
    }
}

getMedia();

function handleMuteClick() {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!cameraOff) {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    } else {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }
}

async function handleCameraChange() {
    // console.log(cameraSelect.value);
    await getMedia(cameraSelect.value, "camera");
}

async function handleMicChange() {
    // console.log(cameraSelect.value);
    await getMedia(micSelect.value, "mic");
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
micSelect.addEventListener("input", handleMicChange);