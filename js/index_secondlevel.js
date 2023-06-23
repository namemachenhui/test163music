FastClick.attach(document.body);
(async function () {
  const diskBox = document.querySelector(".main_box .disk_box"),
        diskWrapper = diskBox.querySelector(".disk_wrapper"),
        imgBox = diskWrapper.querySelector(".img_box"),
        playbtn = document.querySelector(".playbtn"),
        headInfo = document.querySelector(".song_info .head_info"),
        wordsWrapper = document.querySelector(".main_box .words_wrapper"),
        footerBox = document.querySelector(".footer_box"),
        currentBox = footerBox.querySelector(".current"),
        durationBox = footerBox.querySelector(".duration"),
        alreadyBox = footerBox.querySelector(".already"),
        markImageBox = document.querySelector(".others_box .mark_image"),
        loadingBox = document.querySelector(".others_box .loading_box"),
        audioBox = document.querySelector("#audioBox"),
        headTitle = document.querySelector("title");
  let wordpList = [],
      timer = null,
      matchNum = 0;
  const format = function format(time) {
    let minutes = Math.floor(time / 60),
        seconds = Math.round(time - minutes * 60);
    minutes = minutes < 10 ? "0" + minutes : "" + minutes;
    seconds = seconds < 10 ? "0" + seconds : "" + seconds;
    return {
      minutes,
      seconds
    };
  };
  const playend = function playend() {
    clearInterval(timer);
    timer = null;
    currentBox.innerHTML = "00:00";
    alreadyBox.style.width = "0%";
    wordsWrapper.style.transform = "translateY(0)";
    wordpList.forEach(item => item.className = "");
    matchNum = 0;
    playbtn.className = "player-button";
  };
  const handle = function handle() {
    let pH = wordpList[0].offsetHeight;
    let {
      currentTime,
      duration
    } = audioBox;
    if (isNaN(currentTime) || isNaN(duration)) return;
    if (currentTime >= duration) {
      playend();
      return;
    }
    let {
      minutes: currentTimeMinutes,
      seconds: currentTimeSeconds
    } = format(currentTime),
        {
      minutes: durationMinutes,
      seconds: durationSeconds
    } = format(duration),
        ratio = Math.round(currentTime / duration * 100);
    currentBox.innerHTML = `${currentTimeMinutes}:${currentTimeSeconds}`;
    durationBox.innerHTML = `${durationMinutes}:${durationSeconds}`;
    alreadyBox.style.width = `${ratio}%`;
    let matchs = wordpList.filter(item => {
      let minutes = item.getAttribute("minutes"),
          seconds = item.getAttribute("seconds");
      return minutes === currentTimeMinutes && seconds === currentTimeSeconds;
    });
    if (matchs.length > 0) {
      wordpList.forEach(item => item.className = "");
      matchs.forEach(item => item.className = "active");
      matchNum += matchs.length;
      if (matchNum > 2) {
        let offset = (matchNum - 2) * pH;
        wordsWrapper.style.transform = `translateY(${-offset}px)`;
        matchs.forEach(item => {
          console.log(item);
        });
      }
    }
  };
  diskBox.addEventListener("click", function () {
    if (audioBox.paused) {
      audioBox.play();
      diskWrapper.style.animationPlayState = "running";
      playbtn.style.opacity = "0";
      handle();
      if (!timer) timer = setInterval(handle, 1000);
      return;
    }
    audioBox.pause();
    diskWrapper.style.animationPlayState = "paused";
    playbtn.style.opacity = "1";
    clearInterval(timer);
    timer = null;
  });
  const bindLyric = function bindLyric(lyric) {
    let arr = [];
    let index = 1;
    lyric.replace(/\[(\d+):(\d+).(?:\d+)\](.+)\n/g, (_, $1, $2, $3) => {
      arr.push({
        index: index++,
        minutes: $1,
        seconds: $2,
        text: $3.trim()
      });
    });
    console.log("歌词数组:", arr);
    let str = ``;
    arr.forEach(({
      minutes,
      seconds,
      text,
      index
    }) => {
      str += `
        <p minutes="${minutes}" seconds="${seconds}" index="${index}">
          ${text}
        </p>`;
    });
    wordsWrapper.innerHTML = str;
    wordpList = Array.from(wordsWrapper.querySelectorAll("p"));
  };
  const binding = function binding(data) {
    let {
      title,
      author,
      duration,
      pic,
      audio,
      lyric
    } = data;
    imgBox.innerHTML = `
      <img src="${pic}" alt="" />
      `;
    headInfo.innerHTML = `
        <span class="title">${title}</span>
        <span> - </span>
        <span class="singer">${author}</span>
      `;
    headTitle.innerHTML = `${title} - ${author} - 单曲 - 网易云音乐`;
    durationBox.innerHTML = duration;
    markImageBox.style.backgroundImage = `url(${pic})`;
    audioBox.src = audio;
    bindLyric(lyric);
  };
  try {
    let {
      code,
      data
    } = await API.queryLyric();
    if (+code === 200) {
      binding(data);
      return;
    }
  } catch (error) {
    console.log(error);
  }
})();