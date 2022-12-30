function init() {
  var sendWishBtn = document.getElementById("send-wish-btn-idx");
  var senderName = document.getElementById("username-wish-idx");
  var senderEmail = document.getElementById("email-wish-idx");
  var senderContent = document.getElementById("content-wish-idx");
  var wishes = document.getElementById("view-wish-idx");

  sendWishBtn.addEventListener("click", function () {
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
  });
}

init();
