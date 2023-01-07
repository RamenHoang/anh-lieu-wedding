function removeInputErrorStyle(e) {
  if (e.target != this) {
    return;
  }

  if (this.classList.contains("input-error")) {
    this.classList.remove("input-error");
  }
}

function sendWish(senderName, senderContent, senderEmail, wishes) {
  return function (e) {
    e.preventDefault();

    if (!senderName.value) {
      senderName.classList.add("input-error");
      senderName.focus();
      return;
    } else if (!senderContent.value) {
      senderContent.classList.add("input-error");
      senderContent.focus();
      return;
    } else {
      axios
        .post("/wishes", {
          name: senderName.value,
          email: senderEmail.value,
          content: senderContent.value,
        })
        .then(function (response) {
          senderName.value = null;
          senderEmail.value = null;
          senderContent.value = null;

          wishes.innerHTML = response.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  };
}

function init() {
  var sendWishBtn = document.getElementById("send-wish-btn-idx");
  var senderName = document.getElementById("username-wish-idx");
  var senderEmail = document.getElementById("email-wish-idx");
  var senderContent = document.getElementById("content-wish-idx");
  var wishes = document.getElementById("view-wish-idx");

  senderName.addEventListener("keyup", removeInputErrorStyle.bind(senderName));
  senderContent.addEventListener(
    "keyup",
    removeInputErrorStyle.bind(senderContent)
  );

  sendWishBtn.addEventListener(
    "click",
    sendWish(senderName, senderContent, senderEmail, wishes)
  );
}

init();
