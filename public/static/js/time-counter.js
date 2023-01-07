function timeCounterInit() {
    var countDownDate = new Date(weddingDatetime).getTime()
    var counterDayIdx = 'counter-day-idx'
    var counterHourIdx = 'counter-hour-idx'
    var counterMinuteIdx = 'counter-minute-idx'
    var counterSecondIdx = 'counter-second-idx'

    setInterval(function () {
        var now = new Date().getTime()
        var distance = Math.abs(countDownDate - now)
        var days = Math.floor(distance / (1000 * 60 * 60 * 24))
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000)

        document.getElementById(counterDayIdx).innerText = days
        document.getElementById(counterHourIdx).innerText = hours
        document.getElementById(counterMinuteIdx).innerText = minutes
        document.getElementById(counterSecondIdx).innerText = seconds
    }, 1000);
}

timeCounterInit()