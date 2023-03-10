const socket = io()

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const micSelect = document.getElementById("mics");
const call = document.getElementById("call");

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

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
            // api ?????????
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
            // api ?????????
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

// getMedia();

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
    if(myPeerConnection) {
        // ??????????????? ???????????? ???????????? ??? ??????????????? ????????? ????????? ???????????? ?????????
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
        .getSenders()
        .find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

async function handleMicChange() {
    // console.log(cameraSelect.value);
    await getMedia(micSelect.value, "mic");
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
micSelect.addEventListener("input", handleMicChange);

// Welcome Form

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

call.hidden = true;

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    //RTC ?????? ??????
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    roomName = input.value;
    await initCall();
    socket.emit("join_room", roomName);
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", async () => {
    // console.log("someone joined!");
    // offer ??????
    const offer = await myPeerConnection.createOffer();
    // offer ?????? ??????
    myPeerConnection.setLocalDescription(offer);
    // offer ??????
    socket.emit("offer", offer, roomName);
    // offer??? ????????? ???(???)?????? ?????????
    console.log("sent the offer!");
});

socket.on("offer", async offer => {
    // offer??? ?????? ???(???)?????? ?????????
    console.log("received the offer!");
    myPeerConnection.setRemoteDescription(offer);
    // answer ?????? 
    const answer = await myPeerConnection.createAnswer();
    // answer ?????? ??????
    myPeerConnection.setLocalDescription(answer);
    // answer ??????
    socket.emit("answer", answer, roomName);
    // answer??? ????????? ???(???)?????? ?????????
    console.log("sent the answer!");

});

socket.on("answer", answer => {
    // answer??? ?????? ???(???)?????? ?????????
    console.log("received the answer!");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", ice => {
    console.log("received the candidate!");
    myPeerConnection.addIceCandidate(ice);
});

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302"
                ]
            }
        ]
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    // ??? ?????????????????? ?????? ????????? ????????? ??? ?????? ???????????? ???????????? ??????
    myStream.getTracks()
    .forEach(track => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
    socket.emit("ice", data.candidate, roomName);
    console.log("sent candidate");
}

function handleAddStream(data) {
    // console.log("got a stream from peer");
    // console.log("Peer's Stream", data.stream);
    // console.log("My Stream", myStream);
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}