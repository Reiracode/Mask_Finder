let yourPositon, infoData, filterData;
//DOM selectyor  infoData= all json ;filterData=filter data
const loading = document.getElementById("loading");
const seltDist = document.querySelector(".district"); 
const maskSize = document.querySelector("#mask_sel");
//left menu and overlay
const clickBtn = [...document.querySelectorAll(".list_menu")];
const closeBtn = [...document.querySelectorAll(".close_overlay")];
//開合箭頭
const open_arrow = [...document.querySelectorAll(".open_arrow")];
const api =
  "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json";
let maskStore = JSON.parse(localStorage.getItem("maskStore")) || [];
let maskDay = JSON.parse(localStorage.getItem("maskDay")) || [];
// leaflet markersRef)=map上所有的點
let mymarker,
  map,
  mymap,
  markers,
  markersRef = [];
// ios mobile height
let vh = window.innerHeight * 0.01;

document.documentElement.style.setProperty("--vh", `${vh}px`);
window.addEventListener("resize", () => {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
});

//select city
new TwCitySelector({
  el: ".my-selector-c",
  elCounty: ".county",
  elDistrict: ".district",
});

//ICON
let greenIcon = createIcon("icon-11");
let redIcon = createIcon("icon-22");
let userIcon = createIcon("icon-blue");
function createIcon(name) {
  return new L.Icon({
    iconUrl: `./icon/${name}.png`,
    iconSize: [30, 30],
    iconAnchor: [16, 36],
    popupAnchor: [1, -34],
  });
}
  // let today = new Date().toISOString().substr(0, 10);
let picker = new Pikaday({
  field: document.getElementById("userday"),
  format: "YYYY/MM/DD",
  toString(date, format) {
    const day = formatzeoro(date.getDate());
    const month = formatzeoro(date.getMonth() + 1);
    const year = date.getFullYear();
    function formatzeoro(data) {
      const v = !(data.toString().length - 1) ? "0" + data : data;
      return v;
    }
    return `${year}-${month}-${day}`;
  },
  parse(dateString, format) {
    const parts = dateString.split("/");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  },
});
const getPosition = () => {
  // function getPosition() {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      const position = (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      };
      const showError = (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("讀取不到您目前的位置");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("讀取不到您目前的位置");
            break;
          case error.TIMEOUT:
            alert("讀取位置逾時");
            break;
          case error.UNKNOWN_ERROR:
            alert("Error");
            break;
        }
        resolve([23.954635, 120.571868]);
      };
      navigator.geolocation.getCurrentPosition(position, showError);
    }
  });
};

const getAllPoints = async () => {
  const response = await fetch(api);
  const json = await response.json();
  return json.features;
};

async function getPoints() {
  const [position, points] = await Promise.all([getPosition(), getAllPoints()]);
  yourPositon = position;
  infoData = points;
  // console.log(yourPositon);
  // console.log(infoData);
  drawMap();
  nearestStore();
  loading.style.display = "none";
}

getPoints();

// map on load  //markerClusterGroup Customising the Clustered Markers
function drawMap() {
  mymap = L.map("maskmap").on("load", onMapLoad).setView(yourPositon, 15);

  markers = L.markerClusterGroup({
    maxClusterRadius: 120,
    iconCreateFunction: function (cluster) {
      let childCount = cluster.getChildCount();
      let group = " marker-cluster-";
      if (childCount < 5) {
        group += "small";
      } else if (childCount < 10) {
        group += "medium";
      } else {
        group += "large";
      }
      return new L.DivIcon({
        html: "<div><span>" + childCount + "</span></div>",
        className: "marker-cluster" + group,
        iconSize: new L.Point(40, 40),
      });
    },
  });

  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tiles = L.tileLayer(tileUrl, { attribution });
  tiles.addTo(mymap);
  getMymarker();
}

//重新整理
async function relocate() {
  loading.style.display = "flex";
  mymap.removeLayer(mymarker);
  document.querySelector(".county").value = "";
  document.querySelector(".district").value = "";
  yourPositon = await getPosition();
  console.log(yourPositon);
  getMymarker(); // 現在位置
  nearestStore();
  loading.style.display = "none";
  document.querySelector("#relocate").classList.remove("active");
}

// 現在位置
function getMymarker() {
  mymarker = L.marker(yourPositon, { icon: userIcon })
    .addTo(mymap)
    .bindPopup("You're HERE")
    .openPopup();
}

//經緯度算距離
function getDistance(origin, destination) {
  lat1 = origin[0];
  lng1 = origin[1];
  lat2 = destination[0];
  lng2 = destination[1];
  return (
    2 *
    6378.137 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((Math.PI * (lat1 - lat2)) / 360), 2) +
          Math.cos((Math.PI * lat1) / 180) *
            Math.cos((Math.PI * lat2) / 180) *
            Math.pow(Math.sin((Math.PI * (lng1 - lng2)) / 360), 2)
      )
    )
  );
}

//filter by dsitance <1KM
function nearestStore() {
  const res = infoData.filter(
    (point) =>
      getDistance(
        [yourPositon[0], yourPositon[1]],
        [point.geometry.coordinates[1], point.geometry.coordinates[0]]
      ) < 1
  );
  filterData = res;
  renderMask();
}
//filter by select option
function filterPharmacy() {
  const selCity = document.querySelector(".county").value;
  const selDist = document.querySelector(".district").value;
  const res = infoData.filter(({ properties: { county, town } }) => {
    return (
      county.indexOf(selCity.replace(/台/g, "臺")) > -1 &&
      town.indexOf(selDist) > -1
    );
  });
  filterData = res;
  renderMask();
}

function markClick(event) {
  let id = event.layer._leaflet_id;
  let markIndex = markersRef.map((items) => items._leaflet_id).indexOf(id);
  // console.log(markIndex);
  //scroll對應到overlay id的位子點地圖上icon位置的 ，找到click id的index 15
  if (!!document.querySelector(".overlay.active>.datalist")) {
    let overlaylist = document.querySelector(".overlay.active>.datalist");
    let divid = overlaylist.id;
    let all = document.querySelectorAll(`#${divid}>.store_detail`);
    marginBtom = all[0].marginBottom;
    let margbtm = marginBtom.substr(0, marginBtom.length - 2);
    //5px  scrollto 只算前段的div的高度  index=5  len=6 calcu div*index==>index 3  ==>  0+1+2
    let sum = 0;
    for (let i = 0; i < markIndex; i++) {
      sum += parseInt(all[i].scrollHeight) + parseInt(margbtm);
    }
    document.getElementById(`${divid}`).scrollTo(0, sum);
  }
}

//click div store-detail openPopup
function getStore() {
  // console.log(this);
  // console.log(markersRef);
  if (!markersRef[sideInfo.indexOf(this)].isPopupOpen()) {
    let marker = markersRef[sideInfo.indexOf(this)];
    markers.zoomToShowLayer(marker, function () {
      marker.openPopup();
    });
  }
}

//加入最愛
function intoList() {
  let thisdiv = this.parentNode.parentNode;
  let data = filterData[checkInfo.indexOf(this)];
  let itemid = data.properties.id;

  //我的最愛清單 click => 刪除
  if (this.parentNode.parentNode.id == "lovestorelist") {
    this.parentNode.remove();
    //array splice  -取代，刪除
    maskStore.forEach((item, index) => {
      if (item == itemid) maskStore.splice(index, 1);
    });
  } else {
    //我的最愛 if>0  PINK  toggle PINK AND LOCALSTORAGE
    let loveinde = maskStore.indexOf(itemid);
    this.classList.toggle("pink");
    if (this.classList.contains("pink")) {
      if (maskStore.indexOf(itemid) == -1) maskStore.push(itemid);
    } else {
      if (maskStore.indexOf(itemid) > -1) maskStore.splice(loveinde, 1);
    }
    // console.log(maskStore); //index
  }
  localStorage.setItem("maskStore", JSON.stringify(maskStore));
  if (thisdiv.id == "lovestorelist") justifyHeight(thisdiv);
}

function indexPink(id) {
  let res = !!maskStore.length
    ? maskStore.indexOf(id) >= 0
      ? true
      : false
    : false;
  return res;
}

function getStorage() {
  filterData = !!maskStore.length
    ? infoData.filter((item) => maskStore.indexOf(item.properties.id) > -1)
    : [];

  // filterData = res;
  renderMask();
}

function getMyRecord() {
  document.querySelector("#messager_err").innerHTML = "";
  let today = new Date().toISOString().substr(0, 10);
  document.querySelector("#userday").value = today;

  let usersetbtn = document.getElementById("date_set");
  let userdelbtn = document.getElementById("date_set_clear");

  renderStorage();

  function renderStorage() {
    let maskDay = JSON.parse(localStorage.getItem("maskDay")) || [];
    let tnode = "";
    maskDay.forEach((el) => {
      tnode += `<div><span>${el.userday}</span>
                      <span>${el.userps}</span>
                        <a class="todo_list" data-btn="edit"><i class="fas fa-pen-nib"></i> </a>
                        <a class="todo_list" data-btn="del"><i class="far fa-minus-square"></i> </a>
                </div>`;
    });
    document.querySelector("#messager_data").innerHTML = tnode;
    let action = [...document.querySelectorAll(".todo_list")];
    action.forEach((dom) => dom.addEventListener("click", modify));
  }


  function modify() {
    let target = this.dataset["btn"];
    let old = JSON.parse(localStorage.getItem("maskDay")) || [];
    let this_date = this.parentNode.children[0].innerText;
    old.forEach((item, index) => {
      if (item.userday == this_date) {
        old.splice(index, 1);
      }
    });
    console.log(old);
    this.parentNode.remove();
    localStorage.setItem("maskDay", JSON.stringify(old));

    if (target == "edit") {
      let edi_ps = this.parentNode.children[1].innerText;
      document.querySelector("#userday").value = this_date;
      document.querySelector("#userps").value = edi_ps;
    }

    console.log(maskDay);
  }



  userdelbtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("maskDay");
    renderStorage();
  });

  usersetbtn.addEventListener("click", (e) => {
    e.preventDefault();
    let data1 = document.querySelector("#userday").value.trim();
    let data2 = document.querySelector("#userps").value.trim();
    if (!data1.length || !data2.length) {
      alert("請填寫資料");
      return;
    }
    let maskDay = JSON.parse(localStorage.getItem("maskDay")) || [];
    let newItem = {
      userday: document.querySelector("#userday").value.trim(),
      userps: document.querySelector("#userps").value.trim(),
    };

    if (maskDay.some((item) => item.userday == newItem.userday)) {
      // console.log("data already exited");
      document.querySelector("#messager_err").innerHTML = "此日期資料已存在";
    } else {
      document.querySelector("#messager_err").innerHTML = "";
      maskDay.push(newItem);
      localStorage.setItem("maskDay", JSON.stringify(maskDay));
      renderStorage();
      document.querySelector("#userday").value = "";
      document.querySelector("#userps").value = "";
    }
  });

}



  



//select all / adult/ child
function hideSize(user, userclass) {
  userclass == "all"
    ? user.classList.remove("d-none")
    : user.firstElementChild.dataset[userclass] > 0
    ? user.classList.remove("d-none")
    : user.classList.add("d-none");
}

//************************************************
function onMapLoad() {
  console.log("Map successfully loaded");
}

function renderMask() {
  markers.clearLayers();
  markersRef = [];
  s_list = !!document.querySelector(".overlay.active>.datalist")
    ? document.querySelector(".overlay.active>.datalist")
    : document.querySelector("#list>.datalist");

  if (!filterData.length) {
    justifyHeight(s_list);
    return;
  }
  let focus = filterData[0].geometry.coordinates;
  mymap.setView([focus[1], focus[0]], 15);

  let el = "";
  filterData
    .sort(
      ({ geometry: { coordinates: a } }, { geometry: { coordinates: b } }) => {
        return (
          getDistance([yourPositon[0], yourPositon[1]], [a[1], a[0]]) -
          getDistance([yourPositon[0], yourPositon[1]], [b[1], b[0]])
        );
      }
    )
    .forEach(({ properties, geometry: { coordinates } }) => {
      mask = !!properties.mask_adult ? greenIcon : redIcon;
      let typecheck = indexPink(properties.id);
      let marker = L.marker(new L.LatLng(coordinates[1], coordinates[0]), {
        icon: mask,
      });
      //********************************************* */
      let distance = getDistance(
        [yourPositon[0], yourPositon[1]],
        [coordinates[1], coordinates[0]]
      );
      el += `<div class="store_detail">
        <h2 class="store_title" data-child="${
          properties.mask_child
        }" 
        data-adult="${properties.mask_adult}">${properties.name}
        <span><i class="fas fa-map-marker-alt"></i>
            ${
              distance >= 1
                ? distance.toFixed(1) + "km"
                : ((distance * 1000) >> 0) + "m"
            }
        </span>
        </h2>
        <a class="addtolist ${!!typecheck ? "pink" : ""}" >
        <i class="far fa-check-square"></i></a>
        <p><i class="fas fa-briefcase"></i>${properties.address}</p>
        <p><i class="fas fa-phone fa-flip-horizontal"></i>
        <a href="tel:${properties.phone}">${
        properties.phone
      }</a></p>
          ${
            properties.note.length <= 1
              ? " "
              : `<p><i class="fas fa-tag"></i>${properties.note}</p>`
          }
          <div class="mask_size">
          <span data-size='adult'>成人${properties.mask_adult}</span>
          <span data-size='child'>兒童${properties.mask_child}</span>
          </div> 
          <span>最後更新:${properties.updated}</span>
      </div> `;

      s_list.innerHTML = el;
      marker.bindPopup(
        `<h2>${properties.name}</h2>
            <p class="icontype" data-icon="&#xf3c5">
                ${
                  distance >= 1
                    ? distance.toFixed(1) + "km"
                    : ((distance * 1000) >> 0) + "m"
                }
            </p>
            <p class="icontype" data-icon="&#xf124">${properties.address}</p>
            <p class="icontype" data-icon="&#xf879"><a href="tel:${
              properties.phone
            }">${properties.phone}</a></p>
            <div class="mask_size">
                <span data-size="adult">成人${properties.mask_adult}</span>
                <span data-size="child">兒童${properties.mask_child}</span>
            </div>`
      );
      markersRef.push(marker);
      markers.addLayer(marker);
    });

  s_list.scrollTo(0, 0);
  mymap.addLayer(markers);
  // console.log(mymap);

  //marker 點時，算高度到scroll如果有資料，scroll to index
  markers.on("click", (event) => {
    let id = event.layer._leaflet_id;
    let markIndex = markersRef.map((items) => items._leaflet_id).indexOf(id);

    if (!!s_list) {
      let all = document.querySelectorAll(`#${s_list.id}>.store_detail`);
      marginBtom = getComputedStyle(all[0]).marginBottom;
      let margbtm = marginBtom.substr(0, marginBtom.length - 2);
      sum = 0;
      for (let i = 0; i < markIndex; i++) {
        sum += parseInt(all[i].scrollHeight) + parseInt(margbtm);
      }
      document.getElementById(`${s_list.id}`).scrollTo(0, sum);
    }
  });
  mymap.doubleClickZoom.disable();

  sideInfo = [...s_list.children];
  // click div store-detail openPopup
  sideInfo.forEach((dom) => dom.addEventListener("click", getStore));
  // add to list
  checkInfo = [...document.querySelectorAll(`#${s_list.id} .addtolist`)];
  checkInfo.forEach((dom) => dom.addEventListener("click", intoList));
  justifyHeight(s_list);
}

//每次checked 都要調整
function justifyHeight(s_list) {
  // console.log(s_list);
  let mq = window.matchMedia("(max-width: 600px)");

  if (s_list.id == "lovestorelist" || s_list.id == "storelist") {
    let list_len = document.querySelectorAll(
      `#${s_list.id}>.store_detail`
    ).length;
    if (!list_len) {
      s_list.innerHTML = `<p class="nodata">目前沒有資料</p>`;
      s_list.parentElement.classList.add("height_auto");
      return;
    } else {
      s_list.parentElement.classList.remove("height_auto");
    }

    let sum = 0;
    let listlen = document.querySelectorAll(`#${s_list.id}>.store_detail`);
    let marginBtom = getComputedStyle(listlen[0]).marginBottom;
    let margbtm = marginBtom.substr(0, marginBtom.length - 2);

    for (let i = 0; i < listlen.length; i++) {
      sum += parseInt(listlen[i].scrollHeight) + parseInt(margbtm);
    }

    if (sum < window.innerHeight) {
      s_list.parentElement.classList.add("height_auto");
    } else {
      s_list.parentElement.classList.remove("height_auto");
    }

    //mobile
    if (mq.matches) {
      if (sum < (window.innerHeight * 1) / 3) {
        s_list.parentElement.classList.remove("ctrl_size");
      } else {
        s_list.parentElement.classList.remove("height_auto");
      }
    }
  }
}

//overlay
//選擇行政區
seltDist.addEventListener("change", () => {
  maskSize.firstElementChild.classList.add("active");
  filterPharmacy();
});

//選擇size
maskSize.addEventListener("click", (e) => {
  if (e.target.nodeName == "BUTTON") {
    const showTitle = document.querySelectorAll(".store_detail");
    const a_item = e.target.dataset["item"];
    showTitle.forEach((item) => hideSize(item, a_item));
    //button sibling
    e.target.classList.add("active");
    for (let sibling of e.target.parentNode.children) {
      if (sibling !== e.target) sibling.classList.remove("active");
    }
  }
});

// list and overlay toggle
clickBtn.forEach((dom) =>
  dom.addEventListener("click", (e) => {
    let targetID = e.currentTarget.dataset["id"];
    e.currentTarget.classList.toggle("active");
    targetID != "relocate"
      ? document.getElementById(`${targetID}`).classList.toggle("active")
      : "";
    for (let sibling of e.currentTarget.parentNode.children) {
      if (sibling !== e.currentTarget) {
        let siblingtag = sibling.dataset["id"];
        sibling.classList.remove("active");
        //別的就要remove   targetID其他的就要remove
        if (!!siblingtag)
          document.getElementById(siblingtag).classList.remove("active");
      } else {
        switch (targetID) {
          case "personal":
            getMyRecord();
            break;
          case "mystore":
            getStorage();
            break;
          case "list":
            nearestStore();
            break;
          case "relocate":
            relocate();
            break;
          default:
            break;
        }
      }
    }
  })
);
// close overlayß
closeBtn.forEach((dom) =>
  dom.addEventListener("click", (e) => {
    let closeid = e.currentTarget.parentNode;

    closeid.classList.remove("active");
    document
      .querySelector(`.list_menu[data-id=${closeid.id}]`)
      .classList.remove("active");
  })
);

open_arrow.forEach((dom) =>
  dom.addEventListener("click", (e) => {
    //  overlay
    // console.log(e.currentTarget.parentNode);
    console.log(e.currentTarget.parentNode.id);
    let sum = e.currentTarget.parentNode.offsetHeight;
    let mq = window.matchMedia("(max-width: 600px)");
    // //mobile
    if (mq.matches && e.currentTarget.parentNode.id == "mystore") {
      const sum = document.querySelector("#mystore>.datalist").children.length;
      console.log(sum);
      if (sum < 2) {
        e.currentTarget.parentNode.classList.add("half_a");
      } else {
        e.currentTarget.parentNode.classList.remove("half_a");
        e.currentTarget.classList.toggle("active");
        e.currentTarget.parentNode.classList.toggle("ctrl_size");
      }
    } else {
      e.currentTarget.classList.toggle("active");
      e.currentTarget.parentNode.classList.toggle("ctrl_size");
    }
  })
);
