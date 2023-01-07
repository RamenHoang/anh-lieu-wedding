function backgroundAudioInit() {
  var video = document.getElementById("my-video-idx");
  video.volume = 0.5;

  var audioSwitch = document.getElementById("play-audio-idx");
  var volumeImage = document.getElementById("volume-image-idx");
  var comeInButton = document.getElementById("come-in-btn-idx");

  function triggerBackgroundAudio() {
    if (video.muted) {
      volumeImage.setAttribute("src", "/static/volume-on.png");
    } else {
      volumeImage.setAttribute("src", "/static/volume-off.png");
    }

    video.muted = !video.muted;
  }

  function playVideo() {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    document.querySelector(".go-to.go-to-top").click();
    var comeInBackground = document.querySelector(".come-in-background");
    var comeInButton = document.querySelector("#come-in-btn-idx");
    var comeInImage = document.querySelector("#come-in-btn-idx img");

    video.play();

    var fadeEffect = setInterval(function () {
      if (!comeInBackground.style.opacity) {
        comeInBackground.style.opacity = 1;
      }
      if (!comeInButton.style.opacity) {
        comeInButton.style.opacity = 1;
      }
      if (!comeInImage.style.opacity) {
        comeInImage.style.opacity = 1;
      }

      if (comeInBackground.style.opacity > 0) {
        comeInBackground.style.opacity -= 0.05;
        comeInButton.style.opacity -= 0.05;
        comeInImage.style.opacity -= 0.05;
      } else {
        clearInterval(fadeEffect);
        document.querySelector(".come-in").style = "display: none";
      }
    }, 50);
  }

  audioSwitch.addEventListener("click", triggerBackgroundAudio);
  comeInButton.addEventListener("click", playVideo);
}

backgroundAudioInit();
