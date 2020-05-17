    //adjustment vh for ios
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`); 
    window.addEventListener('resize', () => {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    });

    //select city
    new TwCitySelector({
        el: ".my-selector-c",
        elCounty: ".county",
        elDistrict: ".district"
    });

    //DOM
    const loading = document.getElementById("loading");
    const seltDist= document.querySelector('.district');
    const maskSize= document.querySelector('#mask_sel');
    //JSON  data
    var infoData, yourPositon;
    //filterdata
    var callbackData;
    var maskStore = JSON.parse(localStorage.getItem('maskStore')) || [];
    // markersRef)=map上所有的點
var markers, markersRef = [], mymarker, map, mymap;
    //ICON
    var greenIcon = createIcon('icon-1');
    var redIcon = createIcon('icon-2');
    var userIcon = createIcon('iconmonstr-location-1-24');

    function createIcon(name) {
        return new L.Icon({
            iconUrl: `../${name}.png`,
            iconSize: [30, 30],
            iconAnchor: [16, 36],
            popupAnchor: [1, -34]
        });
    } 

    //DEAFULT map on load
    function drawMap(){
        mymap = L.map('maskmap').on('load', onMapLoad).setView(yourPositon, 13);
        markers = L.markerClusterGroup({
            maxClusterRadius: 120,
            iconCreateFunction: function (cluster) {
                var childCount = cluster.getChildCount();
                var group = ' marker-cluster-';
                if (childCount < 5) {
                    group += 'small';
                } else if (childCount < 10) {
                    group += 'medium';
                } else {
                    group += 'large';
                }
                return new L.DivIcon({ 
                    // html: '<div><span>' + childCount + '</span></div>', 
                    html: '<div></div>', 
                    className: 'marker-cluster' + group, 
                    iconSize: new L.Point(40, 40) 
                });
            }
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mymap); 

        getMymarker()
    }

    /*   navigator.geolocation     */
    function getYourPosition() {
        return new Promise(resolve => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    resolve([position.coords.latitude, position.coords.longitude])
                })
            }
            else {
                reject(Error("It broke"));
            }
        });
    }
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    function getMaskInfo() {
        return new Promise(resolve => {
            fetch('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json')
                .then(res => res.json())
                .then(json => {
                    resolve(json.features)
                })
                .catch(err => console.log(err))
        })
    }

    Promise.all([getMaskInfo(), getYourPosition()]).then(resultDatas => {
        loading.style.display = "none"
        infoData = resultDatas[0];
        yourPositon = resultDatas[1]
        console.log(infoData)
        console.log(yourPositon)
        drawMap()
        findMask(filterRange())
    }).catch((err) => {
        console.log(err.message)
    });

    function relocate() {
        mymap.removeLayer(mymarker);
        console.log("重新整理")
        document.querySelector('.county').value="";
        document.querySelector('.district').value="";
        getYourPosition()
            // .then(yourPositon = [23.005838, 120.191035])
            .then(result => yourPositon = result)
            .then(getMymarker())
            // .then(console.log(yourPositon))
            .then(findMask(filterRange()));
    }

    function getMymarker() {
        mymarker = L.marker(yourPositon, { icon: userIcon })
                    .addTo(mymap).bindPopup("現在位置").openPopup();
    }

    //left menu and overlay
    const clickBtn = [...document.querySelectorAll('.list_menu')];
    clickBtn.forEach(dom => dom.addEventListener('click', (e) => {
        var targetID = e.currentTarget.dataset['id'];
        console.log(targetID)
        e.currentTarget.classList.toggle('active');
        console.log(e.currentTarget)

        if (targetID != 'relocate'){
            if (document.getElementById(`${targetID}`).classList.contains('active')) {
                document.getElementById(`${targetID}`).classList.remove('active')
                return
            } else {
                document.getElementById(`${targetID}`).classList.add('active')
            }
        }
        // document.getElementById(`${targetID}`).classList.toggle('active');
        // document.querySelector(`div[data-id="${targetID}"]`).classList.add('active');
        // console.log(document.querySelector('.overlay.active'))

        for (let sibling of e.target.parentNode.children) {
            if (sibling !== e.target) {
                var siblingtag = sibling.dataset['id'];
                sibling.classList.remove('active')
                //別的就要remove   targetID其他的就要remove
                if (!!siblingtag) document.getElementById(siblingtag).classList.remove('active')
            } else {
                switch (targetID) {
                    case "personal":
                        getMyRecord();
                        break;
                    case "mystore":
                        findMask(getStorage());
                        break;
                    case "list":
                        findMask(filterRange());
                        break;
                    case "relocate":
                        console.log("relocate")
                        relocate();
                        return
                    default:
                        break;
                }
            }
        }
    }))

    //acitve的如果等於target.value close overlay
    const closeBtn = [...document.querySelectorAll('.close_overlay')];
    closeBtn.forEach(dom => dom.addEventListener('click',(e)=>{
        let closeid = e.target.parentNode;
        closeid.classList.remove('active');
        //    document.querySelector(".list_menu[data-id="+closeid.id+"]").classList.remove('active');
        document.querySelector(`.list_menu[data-id=${closeid.id}]`).classList.remove('active');
    }))

    // 開合箭頭>
    const open_arrow = [...document.querySelectorAll('.open_arrow')];
    open_arrow.forEach(dom => dom.addEventListener('click',(e)=>{
        e.currentTarget.classList.toggle('active');
        e.currentTarget.parentNode.classList.toggle('ctrl_size');
    }))



    //經緯度算距離
    function getDistance(origin, destination) {
        lat1 = origin[0]
        lng1 = origin[1]
        lat2 = destination[0]
        lng2 = destination[1]
        return 2 * 6378.137 * Math.asin(Math.sqrt(Math.pow(Math.sin(Math.PI * (lat1 - lat2) / 360), 2) + Math.cos(Math.PI * lat1 / 180) * Math.cos(Math.PI * lat2 / 180) * Math.pow(Math.sin(Math.PI * (lng1 - lng2) / 360), 2)))
    }

    // 顯示1KM距離內的藥局
    function filterRange(){
        const result = infoData.filter(item => getDistance([yourPositon[0], yourPositon[1]], [item.geometry.coordinates[1], item.geometry.coordinates[0]]) < 1);
        console.log(result);
        return result;     
    }

    function filterPharmacy() {
        let res = [];
        let selCity = document.querySelector('.county').value;
        let selDist = document.querySelector('.district').value;
        res = infoData.filter(({ properties: { address, county, town } }) => {
            return county.indexOf(selCity.replace(/台/g, '臺')) > -1 && town.indexOf(selDist) > -1
        });
        findMask(res)
    }

    function markClick(event) {
        let id = event.layer._leaflet_id;
        let markIndex = markersRef.map(items => items._leaflet_id) 
                        .indexOf(id);        
        // console.log(markIndex);
        //點地圖上icon位置的 ，找到click id的index 15
        //scroll對應到overlay id的位子
        if (!!document.querySelector('.overlay.active>.datalist')) {
            var overlaylist = document.querySelector('.overlay.active>.datalist');
            var divid = overlaylist.id;
            var all = document.querySelectorAll(`#${divid}>.store_detail`);
            // console.log(overlaylist)
            // console.log(divid)
            marginBtom = getComputedStyle(all[0]).marginBottom;
            var margbtm = marginBtom.substr(0, marginBtom.length - 2);

            //5px  scrollto 只算前段的div的高度  index=5  len=6 calcu div*index==>index 3  ==>  0+1+2 
            var sum = 0;
            for (var i = 0; i < markIndex; i++) {
                sum += parseInt(all[i].scrollHeight) + parseInt(margbtm);
            };
            document.getElementById(`${divid}`).scrollTo(0, sum)
        }
        // console.log(sum)
    } 

    //fetch prmoise
    function getStore(){ 
        if(!markersRef[sideInfo.indexOf(this)].isPopupOpen()){
            let marker = markersRef[sideInfo.indexOf(this)]    
            markers.zoomToShowLayer(marker, function() {
                marker.openPopup();
            });
        }
    }

    //加入最愛 
    function intoList(){
        let thisdiv = this.parentNode.parentNode;
        let data = callbackData[checkInfo.indexOf(this)];
        let itemid = data.properties.id;
    
        //我的最愛清單 click => 刪除
        if (this.parentNode.parentNode.id == "lovestorelist"){
            this.parentNode.remove();
            //array splice  -取代，刪除
            maskStore.forEach((item, index) => {  
                if (item == itemid)  maskStore.splice(index, 1);
            })
        } else {
            //我的最愛 if>0  PINK  toggle PINK AND LOCALSTORAGE
            console.log(maskStore.indexOf(itemid))
            let loveinde  = maskStore.indexOf(itemid);
            this.classList.toggle('pink');
            if (this.classList.contains('pink')){
                if (maskStore.indexOf(itemid) === -1) maskStore.push(itemid);
            }else{
                if (maskStore.indexOf(itemid) > -1) maskStore.splice(loveinde, 1)
            }
            console.log(maskStore)                                //index
        }
        localStorage.setItem('maskStore', JSON.stringify(maskStore));
        if (thisdiv.id =="lovestorelist") justifyHeight(thisdiv);
    }

    function getStorage() {
        console.log(maskStore)
        res = !!maskStore.length
            ? infoData.filter(item => maskStore.indexOf(item.properties.id) > -1)
            : []
        console.log(res)
        return res
    }

    function indexPink(id) {
        let res = maskStore.length ? (maskStore.indexOf(id) >= 0) ? true : false
            : false
        return res
    }

    // 設定日期
// const userday = document.getElementById('userday');
//     const usersetbtn = document.getElementById('date_btn');
// userday.value = !!localStorage.getItem('maskDay')
//         ? localStorage.getItem('maskDay')
//         : ""
//     usersetbtn.addEventListener('click', () => {
//         localStorage.setItem('maskDay', userday.value);
//     })

    function getDatInfo() {
        const dayInfo = ['日', '一', '二', '三', '四', '五', '六']
        let day = new Date().getDay();

        let daydescript = day === 0  
            ? '全部<span>皆</span>' 
            : day % 2 === 0 
                ? '0 2 4 6 8'
                : '1 3 5 7 9'
                // console.log(daydescript)
        document.getElementById('buyday').innerText = dayInfo[day]
        document.getElementById('dayno').innerHTML =  daydescript
    }

function setInputDate(_id) {
    var _dat = document.querySelector(_id);
    var hoy = new Date(),
        d = hoy.getDate(),
        m = hoy.getMonth() + 1,
        y = hoy.getFullYear(),
        data;

    if (d < 10) {
        d = "0" + d;
    };
    if (m < 10) {
        m = "0" + m;
    };

    data = y + "-" + m + "-" + d;
    console.log(data);
};

function getMyRecord(){
    document.querySelector('#messager_err').innerHTML = ""
    setInputDate("#userday");
    var usersetbtn = document.getElementById('date_btn');
    var userdelbtn = document.getElementById('date_btn_clear');
    var thisdiv = document.querySelector('#personal');
    // var maskDay = JSON.parse(localStorage.getItem("maskDay"))||[];
    get();
    userdelbtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem("maskDay");
        get();
    });

    usersetbtn.addEventListener('click', (e) => {
        var maskDay = JSON.parse(localStorage.getItem("maskDay")) || [];
        e.preventDefault();
        let newItem = {
            userday: userday.value,
            userps: userps.value
        };
        console.log(newItem)
        console.log(maskDay)

        if (maskDay.some(item => item.userday == newItem.userday)){
            // alert("data already exited")
            document.querySelector('#messager_err').innerHTML ="此日期資料已存在"
        }else{
            document.querySelector('#messager_err').innerHTML = ""
            maskDay.push(newItem)
            localStorage.setItem('maskDay', JSON.stringify(maskDay));
            get();
        }
    })

    function get(){
        var maskDay = JSON.parse(localStorage.getItem("maskDay"))||[];
        var element = document.querySelector('.myrecord');
        if (!!element) { element.parentNode.removeChild(element); }
        if (!!maskDay.length) {
            var newDiv = document.createElement("div");
            newDiv.className = "myrecord";
            var tnode = "";
            maskDay.forEach(el => {
                console.log(`${el.userday}`)
                tnode += `<div><span>${el.userday}</span><span>${el.userps}</span></div>`
            })
            tnode = `<div>${tnode}</div>`;
            newDiv.innerHTML = tnode;
            // thisdiv.innerHTML = tnode;
            thisdiv.appendChild(newDiv);       
        }
    }
}


    //選擇行政區
    seltDist.addEventListener('change', (event) => {
        maskSize.querySelector('.active').classList.remove('active');
        maskSize.firstElementChild.classList.add('active')
        filterPharmacy();
    });

    //選擇size
    maskSize.addEventListener('click', (e) =>{
        if(e.target.nodeName=='BUTTON'){
            const showTitle = document.querySelectorAll(".store_detail");
            var a_item = e.target.dataset['item'];
            showTitle.forEach(item=>hideUser(item,a_item));
            //button sibling
            e.target.classList.add('active');
            for (let sibling of e.target.parentNode.children) {
                if (sibling !== e.target) sibling.classList.remove('active');
            }
        }
    })

    function hideUser(user,userclass){
        userclass =='all' 
            ? user.classList.remove('d-none') 
            : (user.firstElementChild.dataset[userclass] > 0 )? user.classList.remove('d-none')
                                            : user.classList.add('d-none');
    }



    //************************************************
    function onMapLoad() {
        console.log("Map successfully loaded")
    };

    function onLocationError(e) {
        console.log(e.message);
    }

    function findMask(callback) {
        callbackData = callback;

        markers.clearLayers();
        markersRef = [];

        s_list = (!!document.querySelector('.overlay.active>.datalist')) 
                    ? document.querySelector('.overlay.active>.datalist')
                    : document.querySelector('#list>.datalist');
        // s_list = document.querySelector('.overlay.active>.datalist')       

        if (!(callback.length)){
            s_list.innerHTML="no data"
            s_list.style.height = "100px"
            s_list.parentNode.style.height = "unset";
            return
        }

        var focus = callback[0].geometry.coordinates;
        mymap.setView([focus[1], focus[0]], 13)

        var el = ""
        callback.sort(({ geometry: { coordinates: a } }, { geometry: { coordinates: b } }) => {
            return getDistance([yourPositon[0], yourPositon[1]], [a[1], a[0]]) - getDistance([yourPositon[0], yourPositon[1]], [b[1], b[0]])
        }).forEach(({ properties, geometry: { coordinates } }) => {
            mask = (!!properties.mask_adult) ? greenIcon : redIcon
            var typecheck = indexPink(properties.id)
            var marker = L.marker(new L.LatLng(coordinates[1], coordinates[0]), { icon: mask });  
                //********************************************* */
            var distance = getDistance([yourPositon[0], yourPositon[1]], [coordinates[1], coordinates[0]])
            el +=`<div class="store_detail">
                    <h2 class="store_title" data-child="${properties.mask_child}" 
                    data-adult="${properties.mask_adult}">${properties.name}
                    <span><i class="fas fa-map-marker-alt"></i>${distance >= 1 ? distance.toFixed(1) + 'km' : (distance * 1000 >> 0) + 'm'}</span>
                    </h2>
                    <p class="addtolist ${!!typecheck ? "pink" : ""}" ><i class="far fa-check-square"></i></p>
                    <p><i class="fas fa-briefcase"></i>${properties.address}</p>
                    <p><i class="fas fa-phone fa-flip-horizontal"></i><a href="tel:${properties.phone}">${properties.phone}</a></p>
                    ${properties.note.length <= 1 ? " " : `<p><i class="fas fa-tag"></i>${properties.note}</p>`}
                    <div class="mask_size">
                        <span data-size='adult'>成人${properties.mask_adult}</span>
                        <span data-size='child'>兒童${properties.mask_child}</span>
                    </div> 
                    <span>最後更新:${properties.updated}</span>
                </div> `;

            s_list.innerHTML = el;
            //********************************************* */
            // popUp 時設定 className
            var customOptions = {'maxWidth': '500','minWidth': '170'}

            marker.bindPopup(
                `<h2>${properties.name}</h2>
                    <p><i class="fas fa-map-marker-alt"></i>${distance >= 1 ? distance.toFixed(1) + 'km' : (distance * 1000 >> 0) + 'm'}</p>
                    <p><i class="fas fa-briefcase"></i>${properties.address}</p>
                    <p><i class="fas fa-phone fa-flip-horizontal"></i><a href="tel:${properties.phone}">${properties.phone}</a></p>
                    <div class="mask_size">
                    <span data-size="adult">成人${properties.mask_adult}</span>
                    <span data-size="child">兒童${properties.mask_child}</span>
                    </div>       
                `, customOptions)

            markersRef.push(marker);
            markers.addLayer(marker); 
        })


        s_list.scrollTo(0, 0)
        mymap.addLayer(markers);

        // markers.on("click", markClick);
        if (s_list.id == "lovestorelist") {justifyHeight(s_list)} 

        //marker 點時，算高度到scroll
        markers.on("click", (event)=>{
            var id = event.layer._leaflet_id;
            let markIndex = markersRef.map(items => items._leaflet_id).indexOf(id);
            //如果有資料，scroll to index
            if (!!s_list){
                var all = document.querySelectorAll(`#${s_list.id}>.store_detail`);
                marginBtom = getComputedStyle(all[0]).marginBottom;
                var margbtm = marginBtom.substr(0, marginBtom.length - 2);
                sum = 0;
                for (var i = 0; i < markIndex; i++) {
                    sum += parseInt(all[i].scrollHeight) + parseInt(margbtm);
                };
                document.getElementById(`${s_list.id}`).scrollTo(0, sum)
            }
        });
        mymap.doubleClickZoom.disable();
        sideInfo = [...s_list.children];
        console.log(sideInfo)
        sideInfo.forEach(dom => dom.addEventListener('click', getStore))
        checkInfo = [...document.querySelectorAll(`#${s_list.id}` + ' .addtolist')];
        checkInfo.forEach(dom => dom.addEventListener('click', intoList))
    }

    //每次checked 都要調整
    function justifyHeight(s_list) {
        var mq = window.matchMedia("(max-width: 600px)");
        if (s_list.id == "lovestorelist") {
            var sum = 0;
            var listlen = document.querySelectorAll(`#${s_list.id}>.store_detail`)

            if (!(listlen.length)) { 
                s_list.innerHTML="no data"
                s_list.style.height ="100px"
                return
            };

            var marginBtom = getComputedStyle(listlen[0]).marginBottom;
            var margbtm = marginBtom.substr(0, marginBtom.length - 2);
            for (var i = 0; i < listlen.length; i++) {
                sum += parseInt(listlen[i].scrollHeight) + parseInt(margbtm);
            };
            
            if (sum < window.innerHeight) {
                if (!mq.matches) {
                    console.log("not mobile 資料<window.innerHeight.height，不要scroll")
                    // s_list.style.height = sum + "px";
                    s_list.style.height = null; 
                    s_list.parentElement.style.height = "unset";
                } else {//mobile
                    console.log(sum, window.innerHeight/2)
                    var half = window.innerHeight/2;
                    if (sum < half ) {
                        console.log("資料 < 1/2")
                        s_list.style.height = "unset";
                    }else{
                        console.log("資料 > 1/2") 
                        s_list.style.height =  null; 
                    }
                }
            }else{
                console.log("sum>window.innerHeight")
                if (!mq.matches) {
                    console.log("當視窗寬度>600px時執行")
                    s_list.style.height = "unset";
                    s_list.parentElement.style.height = "100%";
                } else {
                    console.log("當視窗寬度<600px  MOBILE時執行")
                }
            }
        }  
    }

