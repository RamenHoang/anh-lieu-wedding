function backgroundAudioInit() {
  var video = document.getElementById("my-video-idx");
  video.volume = 0.5;
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
