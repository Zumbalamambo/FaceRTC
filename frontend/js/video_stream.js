
'use strict';

let servers = {
    sdpSemantics: 'unified-plan'
}; //server configuration

let pc = new RTCPeerConnection({
    sdpSemantics: 'unified-plan'
});


pc.addTransceiver('video');
pc.addTransceiver('audio');

const video = document.querySelector('#user-webcam');
pc.addEventListener('track', function(evt) {
	console.log("Update Stream");
    if (evt.track.kind == 'video') {
        video.srcObject = evt.streams[0];
    } 
});

function setupP2PWithServer(localOffer)
{
	return new Promise( resolve => {
		fetch("http://127.0.0.1:8080/offer",{
		body: JSON.stringify({
			sdp: localOffer.sdp,
			type: localOffer.type
		}),
		headers: 
		{
			'Content-Type': 'application/json'
		},
		method: 'POST'
		})
		.then(res => res.json())
		.then((json) =>
		{
			console.log(json)
			resolve(json);
		})
	}
	)
}
function setupPC(media_player)
{
	console.log("Setting up client Peer connection");
	pc.createOffer().then((offer) => {
		return pc.setLocalDescription(offer);} //set local description
	)
	.then( () => {		
		return new Promise(function(resolve) {
            if (pc.iceGatheringState == 'complete') {
                resolve();
            } else {
                function checkState() {
                    if (pc.iceGatheringState == 'complete') {
                    	console.log("Local SDP setting up completed")
                        pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                }
                pc.addEventListener('icegatheringstatechange', checkState);
            }
        }); }
	)
	.then( ()  => //now local SDP is successfully created
	{
		let localOffer = pc.localDescription;
		console.log(localOffer);
		return setupP2PWithServer(localOffer);
	}
	).then((json) => {
		console.log("Server SDP: ")
		console.log(json);
		return pc.setRemoteDescription(json);
	}

	)

}


function onIceCandidate(event) {
  getOtherPc(pc).addIceCandidate(event.candidate)
    .then(
      () => onAddIceCandidateSuccess(pc),
      err => onAddIceCandidateError(pc, err)
    );
  console.log(`${getName(pc)} ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onIceStateChange(event) {
  if (pc) {
    console.log(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
    console.log('ICE state change event: ', event);
  }
}