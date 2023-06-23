// 解决 click 事件的300ms延迟问题
FastClick.attach(document.body);

(async function () {
  const diskBox = document.querySelector(".main_box .disk_box"), //唱片盒子，点击该区域，控制播放
    diskWrapper = diskBox.querySelector(".disk_wrapper"), //转动的就是它
    imgBox = diskWrapper.querySelector(".img_box"), //渲染图片
    playbtn = document.querySelector(".playbtn"), //播放按钮图片，播放时消失
    headInfo = document.querySelector(".song_info .head_info"),
    wordsWrapper = document.querySelector(".main_box .words_wrapper"), //歌词包装器，随播放移动，控制歌词滚动
    footerBox = document.querySelector(".footer_box"), //尾部区域，播放进度信息
    currentBox = footerBox.querySelector(".current"), //当前播放时间
    durationBox = footerBox.querySelector(".duration"), //音频总时长
    alreadyBox = footerBox.querySelector(".already"), //已播放进度条
    markImageBox = document.querySelector(".others_box .mark_image"), //图片遮罩层
    loadingBox = document.querySelector(".others_box .loading_box"), //加载中图层
    audioBox = document.querySelector("#audioBox"),
    headTitle = document.querySelector("title"); //音频对象
  let wordpList = [], //接收歌词段落对象的数据
    timer = null; //定时器编号
  //let matchNum = 0; //记录历史匹配的段落数量(不需要了)

  // 格式化时间(获取毫秒进度与补零)
  const formatMore = function format(time) {
    // 假如：time = 141.845285
    let minutes = Math.floor(time / 60), //2---21.845285
      seconds = Math.floor(time - minutes * 60), //21---0.845285
      percent = Math.round((time - minutes * 60 - seconds) * 100);
    // console.log("percent", percent);
    minutes = minutes < 10 ? "0" + minutes : "" + minutes;
    seconds = seconds < 10 ? "0" + seconds : "" + seconds;
    percent = percent < 10 ? "0" + percent : "" + percent;
    return {
      minutes,
      seconds,
      percent,
    };
  };
  const formatLess = function format(time) {
    // 假如：time = 141.845285
    let minutes = Math.floor(time / 60), //2---21.845285
      seconds = Math.round(time - minutes * 60); //21---0.845285
    minutes = minutes < 10 ? "0" + minutes : "" + minutes;
    seconds = seconds < 10 ? "0" + seconds : "" + seconds;
    return {
      minutes,
      seconds,
    };
  };

  // 播放结束,回归状态
  const playend = function playend() {
    clearInterval(timer);
    timer = null;
    currentBox.innerHTML = "00:00";
    alreadyBox.style.width = "0%";
    wordsWrapper.style.transform = "translateY(0)";
    wordpList.forEach((item) => (item.className = ""));
    matchNum = 0;
    playbtn.className = "player-button";
  };

  //音乐控制
  const handle = function handle() {
    let pH = wordpList[0].offsetHeight; //获取段落的整体高度
    let { currentTime, duration } = audioBox;
    // console.log("currentTime", currentTime, "duration", duration);
    if (isNaN(currentTime) || isNaN(duration)) return; //第一次获取数据又可能是NaN(undefined)

    // 播放结束
    if (currentTime >= duration) {
      // 播放结束，回归状态
      playend();
      return;
    }

    // 控制进度条
    let {
      minutes: currentTimeMinutes,
      seconds: currentTimeSeconds,
      percent: currentTimePercent,
    } = formatMore(currentTime); //解构获取当前格式化后的时间(已播放时间)：分秒百分比
    let { minutes: durationMinutes, seconds: durationSeconds } =
      formatLess(duration); //解构获取格式化后的总体时间：分秒
    let ratio = Math.round((currentTime / duration) * 100); //获取已播放时长与总时长的比例,该比例是绿色进度条占灰色总体条的比例
    /* console.log(
      "currentTimeMinutes",
      currentTimeMinutes,
      "currentTimeSeconds",
      currentTimeSeconds,
      "currentTimePercent",
      currentTimePercent
    ); */

    currentBox.innerHTML = `${currentTimeMinutes}:${currentTimeSeconds}`;
    durationBox.innerHTML = `${durationMinutes}:${durationSeconds}`;
    alreadyBox.style.width = `${ratio}%`;

    // 控制歌词：查找和当前播放时间匹配的歌词段落
    let matchs = wordpList.filter((item) => {
      let minutes = item.getAttribute("minutes"),
        seconds = item.getAttribute("seconds"),
        percent = item.getAttribute("percent");
      return (
        minutes === currentTimeMinutes &&
        seconds === currentTimeSeconds &&
        // percent === currentTimePercent //时间太精确，准等已经不行了
        percent <= currentTimePercent //已播放的时间在秒内大于等于歌词段落时间，则可以展示选中，注意是秒内，但是此操作会让同秒内的之前的再次匹配上
      );
    });
    if (matchs.length > 0) {
      // 让匹配的段落有选中样式，而其余的移除选中样式
      wordpList.forEach((item) => (item.className = ""));
      let activeItem = matchs[matchs.length - 1];
      activeItem.className = "active";
      // matchs.forEach((item) => (item.className = "active"));
      // 控制移动：不能再用计数法来控制了
      /* matchNum += matchs.length;
      if (matchNum > 2) {
        console.log("matchNum", matchNum);
        let offset = (matchNum - 2) * pH;
        wordsWrapper.style.transform = `translateY(${-offset}px)`;
      } */

      let index = activeItem.getAttribute("index");
      // console.log("index", index);
      if (index > 2) {
        let offset = (index - 2) * pH;
        wordsWrapper.style.transform = `translateY(${-offset}px)`;
      }
      /* matchs.forEach((item) => {
        console.log(item);
      }); */
    }
  };

  // 点击控制播放
  diskBox.addEventListener("click", function () {
    if (audioBox.paused) {
      // 当前是暂停的：我们让其播放,并让唱片开始转动,并让播放按钮消失
      audioBox.play(); //播放
      diskWrapper.style.animationPlayState = "running"; //转动
      playbtn.style.opacity = "0"; //按钮消失
      // 控制播放时的变化
      // handle();//定时间隔缩短，可以取消首次默认操作
      if (!timer) timer = setInterval(handle, 100);
      return;
    }
    // 当前是播放的：我们让其暂停,并让唱片停止转动,并让播放按钮出现
    audioBox.pause(); //暂停播放
    diskWrapper.style.animationPlayState = "paused"; //暂停转动
    playbtn.style.opacity = "1"; //按钮出现
    // 清除定时器
    clearInterval(timer);
    // 清空定时器编号
    timer = null;
  });

  /* 绑定歌词信息 */
  const bindLyric = function bindLyric(lyric) {
    // 解析歌词信息
    let arr = [];
    let index = 1;
    lyric.replace(/\[(\d+):(\d+).(\d+)\](.+)\n/g, (_, $1, $2, $3, $4) => {
      arr.push({
        index: index++,
        minutes: $1,
        seconds: $2,
        percent: $3, //歌曲节奏太快，以秒为最小单位划分单词有点跟不上了，需要更小的单位
        text: $4.trim(),
      });
    });
    console.log("歌词数组:", arr);
    // 歌词绑定
    let str = ``;
    arr.forEach(({ minutes, seconds, percent, index, text }) => {
      //percent是一秒之内的百分比进度
      str += `
        <p minutes="${minutes}" seconds="${seconds}" percent="${percent}" index="${index}">
          ${text === "" ? "<span style='opacity:0;'>占位</span>" : text}
        </p>`; //网易傻吊弄空白歌词，占据段落，占据时间，就是不占位置，需要手工占位，不然每经过一个空白，歌词就要比之前朝上一截
    });
    wordsWrapper.innerHTML = str;
    // 获取所有的P标签
    wordpList = Array.from(wordsWrapper.querySelectorAll("p"));
    // console.log("歌词段落数组:", wordpList);
  };
  // 绑定数据
  const binding = function binding(data) {
    let { title, author, duration, pic, audio, lyric } = data;
    // @1 绑定歌曲基本信息
    imgBox.innerHTML = `
      <img src="${pic}" alt="" />
      `;
    headInfo.innerHTML = `
        <span class="title">${title}</span>
        <span> - </span>
        <span class="singer">${author}</span>
      `;
    headTitle.innerHTML = `${title} - ${author} - 单曲 - 网易云音乐`;
    // @2 杂七杂八的信息
    durationBox.innerHTML = duration;
    markImageBox.style.backgroundImage = `url(${pic})`;
    audioBox.src = audio;
    // @3 绑定歌词信息
    bindLyric(lyric);
    // @4 关闭Loading效果
    loadingBox.style.display = "none";
  };

  /* 模拟向服务器发送请求，从服务器获取相关的数据 */
  try {
    let { code, data } = await API.queryLyric();
    if (+code === 200) {
      // 请求成功：模拟网络层和业务层都成功
      // 绑定数据
      binding(data);
      return;
    }
  } catch (error) {
    console.log(error);
  }
  // 请求失败
  // alert("网络繁忙，请刷新页面");
})();
