// initialize the btn&input elemenet
let queryinfoBtn = document.getElementById("queryVideoInfo");
let downloadButton = document.getElementsByClassName("download-button")[0];
let url = document.getElementById("url-input");
// 添加監聽到查詢按鈕
queryinfoBtn.addEventListener("click", (e) => {
  e.preventDefault();
  let videoId = url.value.slice(-11);
  console.log(videoId);
  var player;
  // Youtube Iframe用來嵌入影片
  function onYouTubeIframeAPIReady(videoId) {
    //初始化元素狀態
    let initialDiv = document.createElement("div");
    initialDiv.id = "player";
    let prePlayer = document.getElementById("player");
    prePlayer.parentNode.replaceChild(initialDiv, prePlayer);
    //插入新的Iframe物件
    player = new YT.Player("player", {
      height: "390",
      width: "640",
      videoId: videoId,
      playerVars: {
        playsinline: 1,
      },
      events: {
        onReady: onPlayerReady,
      },
    });
  }
  function onPlayerReady() {
    let videoTitle = document.getElementById("player").title;
    let title = document.querySelector("section>h2");
    title.innerHTML = videoTitle;
  }
  onYouTubeIframeAPIReady(videoId);
  // 獲取查詢影片的基本資訊
  let divinfoRoot = document.querySelector(".videoInfo>ul");
  divinfoRoot.innerHTML = "讀取中請稍後.....";
  axios
    .post("https://106.1.189.146:8080//video_info", {
      url: url.value,
    })
    .then((res) => {
      divinfoRoot.innerHTML = "";
      const data = res.data;
      // 遍歷生成基本資訊元素以及轉換按鈕
      for (let key in data) {
        let child = document.createElement("li");
        let childbtn = document.createElement("button");
        childbtn.setAttribute("class", "convertBtn");
        childbtn.setAttribute("value", key);
        child.setAttribute("class", "video-itme");
        for (let attr in data[key]) {
          child.setAttribute(attr, data[key][attr]);
        }
        childbtn.innerText = "轉換";
        // 增加轉換按鈕的監聽事件
        childbtn.addEventListener("click", (e) => {
          axios
            .post("https://106.1.189.146:8080//download_video", {
              url: url.value,
              tag: e.target.value,
            })
            .then((res) => {
              const eventSource = new EventSource(
                `https://106.1.189.146:8080/sse_progress?url=${url.value.slice(
                  -11
                )}&tag=${e.target.value}`
              );
              // 生成轉換進度條
              let progressElement = document.createElement("progress");
              progressElement.setAttribute("class", "downloadProgress");
              progressElement.value = 0;
              progressElement.max = 100;
              e.target.parentNode.replaceChild(progressElement, e.target);
              eventSource.onmessage = function (event) {
                const progress = parseInt(event.data);
                progressElement.value = progress;
                if (progress === 100) {
                  // 轉換完成，生成下載按鈕
                  let downlaodBtn = document.createElement("a");
                  downlaodBtn.setAttribute("class", "downloadBtn");
                  downlaodBtn.innerText = "下載";
                  progressElement.parentNode.replaceChild(
                    downlaodBtn,
                    progressElement
                  );
                  downlaodBtn.href = `https://106.1.189.146:8080/download_complete?url=${url.value.slice(
                    -11
                  )}&tag=${e.target.value}`;
                }
              };
              eventSource.onerror = function () {
                eventSource.close();
              };
            });
        });
        child.innerHTML = `<span>影片編號: ${data[key]["itag"]} 影片類型: ${
          data[key]["mime_type"]
        } ${
          data[key]["type"] === "video"
            ? "解析度: " + data[key]["res"]
            : "碼率: " + data[key]["abr"]
        } 影片大小: ${data[key]["size"]}MB</span>`;
        child.appendChild(childbtn);
        divinfoRoot.appendChild(child);
      }
    });
});
