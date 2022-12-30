function backgroundAudioInit() {
  // var audio = new Audio(audioPath);
  // audio.volume = 0.1;
  // audio.loop = true;
  // audio.autoplay = true;

  var video = document.getElementById("my-video-idx");
  var audioSwitch = document.getElementById("play-audio-idx");
  var volumeImage = document.getElementById("volume-image-idx");

  function triggerBackgroundAudio() {
    if (video.muted) {
      volumeImage.setAttribute("src", "/static/volume-on.png");
    } else {
      volumeImage.setAttribute("src", "/static/volume-off.png");
    }

    video.muted = !video.muted;
  }

  audioSwitch.addEventListener("click", triggerBackgroundAudio);
}

backgroundAudioInit();
