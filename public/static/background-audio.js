function backgroundAudioInit() {
  var audio = new Audio(audioPath);
  audio.volume = 0.1;
  audio.loop = true;
  audio.autoplay = true;

  var audioSwitch = document.getElementById("play-audio-idx");
  var volumeImage = document.getElementById("volume-image-idx");

  function triggerBackgroundAudio() {
    if (audio.paused) {
      audio.play();
      volumeImage.setAttribute("src", "/static/volume-on.png");
      resolve(true);
    }

    audio.pause();
    volumeImage.setAttribute("src", "/static/volume-off.png");
    return;
  }

  audioSwitch.addEventListener("click", triggerBackgroundAudio);
}

backgroundAudioInit();
