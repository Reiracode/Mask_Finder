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

    const loading = document.getElementById("loading");
    const seltDist= document.querySelector('.district');
    const maskSize= document.querySelector('#mask_sel');

    let selCity, selZone, markers, infoData;
    let yourPositon ;
    let latitude, longitude;

    var greyIcon = createIcon('iconmonstr-grey');
    var greenIcon = createIcon('iconmonstr-blue1');
    var redIcon = createIcon('iconmonstr-grey');
    var userIcon = createIcon('iconmonstr-yellow1');
    let maskStore = JSON.parse(localStorage.getItem('maskStore')) || [];
    var lati;

var alldata;// global promise=>get value
var testInfo = getMaskInfo();
console.log(testInfo)
testInfo.finally(() => alert("Promise ready"))
    //.then(result => console.log(result)); 
    .then(result => alldata = result)
    // .then(result => {
    //     alldata = result;
    //     console.log(alldata)
    // })

console.log(alldata)//undefined

//可掌握promise狀況
//promise pending resolved
/*
new Promise((resolve, reject) => {
  setTimeout(() => resolve("reira you get it"), 2000)
})
  .finally(() => alert("Promise ready"))
  .then(result => alert(result)); // <-- .then handles the result



  let test =new Promise((resolve, reject) => {
  setTimeout(() => resolve("reira you get it"), 2000)
})

test.finally(() => alert("Promise ready"))
  .then(result => alert(result)); //


   */

    function createIcon(name) {
        if (name == 'iconmonstr-yellow1') {
            return new L.Icon({
                iconUrl: `../${name}.png`,
                iconSize: [40, 40],
                iconAnchor: [16, 36],
                popupAnchor: [1, -34]
            });
        }else{
            return new L.Icon({
                iconUrl: `../${name}.png`,
                iconSize: [20, 20],
                iconAnchor: [20, 10],
                popupAnchor: [1, -34]
            });
        }
    } 



//map on load
    function drawMap(){
        console.log(alldata)
        console.log(yourPositon)
        // const map = L.map('map').setView([latitude, longitude], 16).on('dragend', getAroundStore).on('zoomend', getAroundStore);
        // var map = L.map('map').on('load', findMask).setView([25.040065, 121.523235], 13);
        //  map = L.map('map', {
        //     center: yourPositon,
        //     zoom: 16
        // })
        // .on('load', onMapLoad);
        map = L.map('map').on('load', onMapLoad).setView(yourPositon, 13);
        // map = L.map('map').on('load', onMapLoad).setView([25.040065, 121.523235], 13);
        
        // map.setView([51.505, -0.09], 13);

        //Custom radius and icon create function
        markers = L.markerClusterGroup({
            maxClusterRadius: 120,
            iconCreateFunction: function (cluster) {
                var childCount = cluster.getChildCount();
                var c = ' marker-cluster-';
                if (childCount < 5) {
                    c += 'small';
                } else if (childCount < 10) {
                    c += 'medium';
                } else {
                    c += 'large';
                }
                return new L.DivIcon({ 
                    // html: '<div><span>' + childCount + '</span></div>', 
                    html: '<div></div>', 
                    className: 'marker-cluster' + c, 
                    iconSize: new L.Point(40, 40) 
                });
            }
        });

        // var markersRef = [];
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map); 

        // map.on('load', onMapLoad);
        // map.on('load', function () {
        //     alert('The map load event is fired');
        // });

    }

    // map.doubleClickZoom.disable();
    function onLocationFound(e) {
        console.log('onLocationFound')
        var radius = e.accuracy / 2;
        console.log(e.latlng)
        console.log(radius)
        console.log(e.accuracy)

        // L.marker(e.latlng,{icon: userIcon})
        L.marker(yourPositon, { icon: userIcon })
            .addTo(map)
            .bindPopup("我的位置").openPopup();

        L.circle(e.latlng, {radius:500}).addTo(map);
    }

    function onLocationError(e) {
        console.log(e.message);
    }

    // Promise.allを使って、3つのpromiseを同時に実行している
    //let [latitude, longitude] = getPosition();
    //getUserPosition callback function 沒有用 promise.all(new promise 才行嗎)
Promise.all([getMaskInfo(), getUrposition()]).then(resultDatas => {
        console.log(resultDatas[0]);
        console.log(resultDatas[1]);

        //console.log(resultDatas[2]);

        loading.style.display = "none"
        infoData = resultDatas[0];

        yourPositon = resultDatas[1]
        [latitude, longitude] = resultDatas[1];
        // console.log([latitude, longitude])

        drawMap()


        markers = L.markerClusterGroup({
			maxClusterRadius: 120,
			iconCreateFunction: function (cluster) {
                var childCount = cluster.getChildCount();
                var c = ' marker-cluster-';
                if (childCount < 5) {
                    c += 'small';
                } else if (childCount < 10) {
                    c += 'medium';
                } else {
                    c += 'large';
                }
                return new L.DivIcon({ 
                    // html: '<div><span>' + childCount + '</span></div>', 
                    html: '<div></div>', 
                    className: 'marker-cluster' + c, 
                    iconSize: new L.Point(40, 40) 
                });
			}
		});
        findMask()
        markers.on("click", markClick); 
        map.on('load', onMapLoad);
        map.on('locationfound', onLocationFound);
}).catch((err) => {
    console.log(err.message)
});
    // }).then(function (msg) {
    //     console.log(msg);
    // });


function onMapLoad() {
    alert("Map successfully loaded")
};

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    function positionWath() {
        navigator.geolocation.watchPosition((data) => {
            // 若成功取回，就會回傳一組Position，將其印出
            console.log(data);
            // 利用coords.speed取得速度(公尺/秒)
            // speed.textContent = data.coords.speed;
            // 用coords.heading取得方位（表示偏離北方的角度，0為正北，90為正東）
            // 用element.style.transform =rotate()deg來旋轉指針
            // arrow.style.transform = `rotate(${data.coords.heading}deg)`;
        }, (err) => {
            // 假設未取得定位授權，回傳錯誤訊息
            console.error(err);
        });                    
    }


/*   navigator.geolocation     */

/* getLocationA */
    var getLocationA = function () {
        if (navigator.geolocation) {
            console.log('getLocationA--OK')
            navigator.geolocation.getCurrentPosition(success, error);          
        } else { 
            console.log("Geolocation is not supported by this browser.");
            alert("Geolocation is not supported by this browser.");
        }  
    }

    function error(err) {
        alert(`Failed to locate. Error: ${err.message}`)
        console.log(`Failed to locate. Error: ${err.message}`)
    }

    function success(pos) {
        console.log([pos.coords.latitude, pos.coords.longitude])
        console.log(`${pos.coords.latitude}, ${pos.coords.longitude}`)
        // findMask();          
    }

    function getUrposition(){
        // var promise = 
        return new Promise(function(resolve, reject) {
            // do a thing, possibly async, then…
            if (navigator.geolocation) {
                console.log("Stuff worked!");
                // resolve("Stuff worked!");
                navigator.geolocation.getCurrentPosition(position => {   
                    console.log([position.coords.latitude, position.coords.longitude])
                    resolve([position.coords.latitude, position.coords.longitude])
                })   
            }
            else {
                alert("It broke");
                console.log("It broke");
                reject(Error("It broke"));  
            }
        });
    }

// async function main() {
//     var result = await getUrposition()
//     // result === "Success"
//     console.log(result)

//     yourPositon = result
//     findMask(0)
// }
function main() {
    console.log("重新整理")
    // getPosition().then((result)=>console.log(result));
    getUrposition().then(findMask());
}


function getUserPosition() {
    if (navigator.geolocation) {
        function showPosition(position) {
            var crd = position.coords;
            lati = [crd.latitude, crd.longitude]
            //console.log(lati)

            L.marker([position.coords.latitude, position.coords.longitude], { icon: userIcon }).addTo(map);
            map.setView([position.coords.latitude, position.coords.longitude], 16);
            console.log([position.coords.latitude, position.coords.longitude])
        }

        function showError(err) {
            console.warn('ERROR(' + err.code + '): ' + err.message);
            // console.log('抱歉，現在無法取的您的地理位置。')
        }

        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        console.log('抱歉，您的裝置不支援定位功能。');
    }
}

/*   navigator.geolocation     */


    function getAroundStore(){
            // filterMaskType(filterRangeStore(infoData)).filter((info, index) => index < 200)
            dataAll= filterRange()
            console.log(dataAll)
    }

/**/
//left menu and overlay
//data vs layout
    var clickBtn =[...document.querySelectorAll('.list_menu')];
    clickBtn.forEach(dom => dom.addEventListener('click',(e)=>{  
        // console.log(e)
        var targetID = e.currentTarget.dataset['id'];
        e.currentTarget.classList.toggle('active');

        for (let sibling of e.target.parentNode.children) {     
            if (sibling !== e.target){
                var siblingtag = sibling.dataset['id'];
                sibling.classList.remove('active')
                //別的就要remove   targetID其他的就要remove
                if (!!siblingtag)  document.getElementById(siblingtag).classList.remove('active')
            }else{
                switch (targetID) {
                    case "personal":
                        getStorage();
                        break;
                    case "setdate":
                        findMask("setdate");
                        break;
                    case "list":
                        console.log("findmask")
                        findMask();
                        break;
                    case "relocate":
                        //getLocationA();
                        main()
                        //getUrposition();
                        break;
                    default:
                        break;
                }

                if (targetID =='relocate') break;
                // document.getElementById(`${targetID}`).classList.toggle('active');
                document.querySelector(`div[data-id="${targetID}"]`).classList.toggle('active');
            }           
        }
    }))


// acitve的如果等於target.value
//close overlay
const closeBtn = [...document.querySelectorAll('.close_overlay')];
closeBtn.forEach(dom => dom.addEventListener('click',(e)=>{
    let closeid = e.target.parentNode;
    closeid.classList.remove('active');
    document.querySelector(".list_menu[data-id="+closeid.id+"]").classList.remove('active');
}))
// 開合箭頭>
const open_arrow = [...document.querySelectorAll('.open_arrow')];
open_arrow.forEach(dom => dom.addEventListener('click',(e)=>{
    e.currentTarget.classList.toggle('active');
    e.currentTarget.parentNode.classList.toggle('ctrl_size');
}))
// 設定日期
var  userday = document.getElementById('userday');
var  usersetbtn = document.getElementById('date_btn');
userday.value =  !!localStorage.getItem('maskDay')
    ? localStorage.getItem('maskDay')
    : ""
usersetbtn.addEventListener('click',()=>{
    localStorage.setItem('maskDay', userday.value);
})
    
// function showPositionA(position) {
//     console.log("showPositionA");
//     var [nowlat,nowlon]= [position.coords.latitude,position.coords.longitude];
//     console.log("Latitude: " + position.coords.latitude + 
//             "Longitude: " + position.coords.longitude);
// }

// 顯示1KM距離內的藥局
function filterRange(){
    // const result = infoData.filter(item => getDistance([latitude, longitude],[item.geometry.coordinates[1], item.geometry.coordinates[0]]) < 1);
    const result = infoData.filter(item => getDistance([yourPositon[0], yourPositon[1]], [item.geometry.coordinates[1], item.geometry.coordinates[0]]) < 1);
    console.log(result);
    return result;     
}

function markClick(event) {
    var id = event.layer._leaflet_id;
    console.log(markersRef)//map上所有的點
    const markIndex = markersRef.map(items => items._leaflet_id) 
                    .indexOf(id);        
    console.log(markIndex);
    //點地圖上icon位置的 ，找到click id的index 15
    //scroll對應到overlay id的位子

    var all = document.querySelectorAll('.store_detail')    
    style = getComputedStyle(all[0]);
    marginBtom = style.marginBottom;
    var margbtm = marginBtom.substr(0,marginBtom.length-2);
    //5px  scrollto 只算前段的div的高度  index=5  len=6 calcu div*index
    //index 3  ==>  0+1+2 
    var sum = 0; 
    for (var i = 0; i < markIndex; i++) {
        sum += parseInt(all[i].scrollHeight) + parseInt(margbtm);
    };

    document.getElementById('storelist').scrollTo(0,sum)
} 

// console.log(markersRef)
// console.log(markers); // i(45 markers) ._leaflet_id

function filterRangeStore(info){
    return info.filter(({geometry: {coordinates}})=>{
        if(range){
            return getDistance(latitude, longitude, coordinates[1], coordinates[0]) < range
        }else {
            let bounds = {
            W: map.getBounds().getNorthWest().lng,
            E: map.getBounds().getNorthEast().lng,
            N: map.getBounds().getNorthWest().lat,
            S: map.getBounds().getSouthEast().lat
            }
            return (coordinates[0] < bounds.E && coordinates[0] > bounds.W)
            && (coordinates[1] < bounds.N && coordinates[1] > bounds.S)
        }
    })
}


//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function getMaskInfo(){
    return new Promise(resolve=>{
        fetch('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json')
            .then(res=>res.json())
            .then(json=>{
                //resolve(json.features)
                const data = resolve(json.features)
                resolve(data)
                // console.log(json.features);
            })
            .catch(err=>console.log(err))
            .then(response => {
                // loading.style.display = "none"
            });
    })
}
//如果有錯誤 .catch==>TypeError: Failed to fetch


// function getPosition() {
//     return new Promise(resolve => {
//         !!(navigator.geolocation)
//             ? navigator.geolocation.getCurrentPosition(position => {
//                 resolve([position.coords.latitude, position.coords.longitude])
//                 console.log([position.coords.latitude, position.coords.longitude]);
//             })
//             : alert("Geolocation is not supported by your browser")
//     })
// }

// const p = getPosition();
// p.then(function () { 
//     console.log("getPosition OK");
// });
// p.catch(function (err) { 
//     console.log("getPosition"+ err.message)
// });

function getMaskData(){
    fetch('https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json')
    .then(res => {
        return res.json();
    }).then(result => {
        console.log(result.features);
        // let city = result.cwbopendata.location[14].parameter[0].parameterValue;
        // let temp = result.cwbopendata.location[14].weatherElement[3].elementValue.value;
        // console.log(`${city}的氣溫為 ${temp} 度 C`); // 得到 高雄市的氣溫為 29.30 度 C
    });
}



function getStore(){ 
    console.log(this)
    console.log(markersRef)
    console.log([sideInfo.indexOf(this)])
    console.log(sideInfo)

    if(!markersRef[sideInfo.indexOf(this)].isPopupOpen()){
        let marker = markersRef[sideInfo.indexOf(this)]
        console.log(marker)
        map.setView([marker._latlng.lat, marker._latlng.lng], 18)
        markers.zoomToShowLayer(marker, function() {
            marker.openPopup();
        });
    }
}

//加入最愛
function intoList(){
    let data = dataAll[checkInfo.indexOf(this)];
    let itemid = data.properties.id;
    console.log(this)
    //我的最愛清單 click => 刪除
    if (this.parentNode.parentNode.id == "lovestorelist"){
        // this.parentNode.style.display = "none"
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
}

function getStorage() {
    if (maskStore.length) {
        var filteredArray = infoData.filter((item)=>{
            return maskStore.indexOf(item.properties.id) > -1;
        });
        console.log(filteredArray)
        return filteredArray;       
    }else{
        return "";            
    }
    //return 主動找資料，findMask被趨動
}

function indexPink(id){
        //if (maskStore && maskStore.length > 0) { 
    if (maskStore.length) { 
        if (maskStore.indexOf(id)>=0){
            return true
        }else{
            return false
        }
    }else{
        return false
    }
}


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


//選擇行政區
seltDist.addEventListener('change', (event) => {
    maskSize.querySelector('.active').classList.remove('active');
    maskSize.firstElementChild.classList.add('active')
    findMask();
});

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

// var markers = new L.MarkerClusterGroup().addTo(map);
function getDistance(origin, destination) {
    lat1 = origin[0]
    lng1 = origin[1] 
    lat2 = destination[0]
    lng2 = destination[1]
    // console.log(origin)
    // console.log(destination)
    return 2 * 6378.137 * Math.asin(Math.sqrt(Math.pow(Math.sin(Math.PI * (lat1-lat2)/360), 2)+Math.cos(Math.PI * lat1/180) * Math.cos(Math.PI * lat2/180)*Math.pow(Math.sin(Math.PI*(lng1-lng2)/360), 2)))
}

function toRadian(degree) {
    return degree*Math.PI/180;
}

//************************************************
function filterPharmacy () {
    let res = [];
    selCity = document.querySelector('.county').value;
    selDist = document.querySelector('.district').value;
    console.log(selCity)//台北市  json 臺北市
    console.log(selDist)

    res = infoData.filter(({properties: {address, county, town}}) => {
        //return county=="臺北市" && town=="萬華區" 
        return county.indexOf(selCity.replace(/台/g, '臺'))> -1  && town.indexOf(selDist)> -1
    });
    console.log(res)
    return res;
}

    function findMask(e) {
        console.log(e)
        console.log([latitude, longitude])
        console.log(yourPositon)
        // console.log(infoData)
      
        L.marker(yourPositon,{icon: userIcon})
                .addTo(map)
                .bindPopup("我的位置").openPopup();

        markers.clearLayers();
        markersRef = [];
        //資料
        dataAll = !! e ? getStorage()
                        : !(document.querySelector('.county').value)
                                ?  filterRange()
                                :  filterPharmacy()

        const s_list =!! e ?  document.getElementById('lovestorelist')
                            : document.getElementById('storelist');

        const sdiv =!! e ?  '#lovestorelist'
                        : '#storelist'; 
                                
        console.log(s_list)
        console.log(sdiv)
        console.log(dataAll)
        // // const s_list = document.getElementById('storelist')
        s_list.innerHTML = ''; 
        if (sdiv == '#lovestorelist')  
        { s_list.setAttribute('data-list', 'love-store');}
        

        // if (dataAll && dataAll.length >0){
        if (dataAll.length){
            var focus = dataAll[0].geometry.coordinates;
            // map.setView([latitude,longitude], 16);
            map.on('load', onMapLoad);
                map.setView([focus[1], focus[0]], 18)
                // markers.zoomToShowLayer(marker, function() {
                //     marker.openPopup();
                // });

            var el= ""
            dataAll.sort(({geometry: {coordinates: a}}, {geometry: {coordinates: b}})=>{
               // return getDistance([latitude, longitude], [a[1], a[0]]) - getDistance([latitude, longitude], [b[1], b[0]])
                return getDistance([yourPositon[0], yourPositon[1]], [a[1], a[0]]) - getDistance([yourPositon[0], yourPositon[1]], [b[1], b[0]])
            }).forEach(({properties, geometry: {coordinates}})=>{
                console.log(properties.name)
                mask = (!!properties.mask_adult)? greenIcon :redIcon    
                var typecheck = indexPink(properties.id)
                var marker = L.marker(new L.LatLng(coordinates[1],coordinates[0]),{icon:mask});
                // var distance =  getDistance([latitude,longitude],[coordinates[1], coordinates[0]])
                var distance = getDistance([yourPositon[0], yourPositon[1]], [coordinates[1], coordinates[0]])
                        el +=  
                        `<div class="store_detail">
                            <h2 class="store_title" data-child="${properties.mask_child}" 
                            data-adult="${properties.mask_adult}">${properties.name}
                            <span><i class="fas fa-map-marker-alt"></i>${distance >= 1 ? distance.toFixed(1) + 'km' : (distance * 1000 >>0) + 'm'}</span>
                            </h2>
                            <p class="addtolist ${!!typecheck? "pink" : ""  }" ><i class="far fa-check-square"></i></p>
                            <p><i class="fas fa-briefcase"></i>${properties.address}</p>
                            <p><i class="fas fa-phone fa-flip-horizontal"></i><a href="tel:${properties.phone}">${properties.phone}</a></p>
                            ${properties.note.length <= 1 ? " ": `<p><i class="fas fa-tag"></i>${properties.note}</p>`}
                            <div class="mask_size">
                                <span data-size='adult'>成人${properties.mask_adult}</span>
                                <span data-size='child'>兒童${properties.mask_child}</span>
                            </div> 
                            <span>最後更新:${properties.updated}</span>
                        </div> 
                        `; 
                    s_list.innerHTML = el;

                var customOptions =
                    {   'maxWidth': '500',
                        'minWidth': '170',
                        // 'className' : 'custom'
                    }

                marker.bindPopup(
                    `<h2>${properties.name}</h2>
                    <p><i class="fas fa-map-marker-alt"></i>${distance >= 1 ? distance.toFixed(1) + 'km' : (distance * 1000 >>0) + 'm'}</p>
                    <p><i class="fas fa-briefcase"></i>${properties.address}</p>
                    <p><i class="fas fa-phone fa-flip-horizontal"></i><a href="tel:${properties.phone}">${properties.phone}</a></p>
                    <div class="mask_size">
                    <span data-size="adult">成人${properties.mask_adult}</span>
                    <span data-size="child">兒童${properties.mask_child}</span>
                    </div>       
                `,customOptions)  

                markersRef.push(marker);
                markers.addLayer(marker); 
            })  
            console.log(markersRef)
            // sideInfo = [...s_list.childNodes];
            // console.log(sideInfo)  
            sideInfo = [...s_list.children];
            console.log(sideInfo)  
            console.log(sideInfo[0].offsetHeight)  

            // sideInfo = [...document.querySelectorAll('.store_title')]  
            // console.log(sideInfo)  
            sideInfo.forEach(dom => dom.addEventListener('click', getStore))
            //checkInfo =[...document.querySelectorAll('.addtolist')] ;
            checkInfo =[...document.querySelectorAll(sdiv+' .addtolist')] ;
            // [...document.querySelectorAll('#lovestorelist .addtolist')] ;
            checkInfo.forEach(dom=>dom.addEventListener('click', intoList))

            if (s_list.id =="lovestorelist"){
                var stest = document.getElementById("lovestorelist").children
                var lovesum = 0;
                for (let i = 0; i < stest.length; i++) {
                    console.log(i)
                    console.log(stest[i].scrollHeight)
                    console.log(stest[i].offsetHeight)
                };


                var sum = 0; 
                var test = document.getElementsByClassName('#lovestorelist>.store_detail')
                console.log(test)
                const listlen = document.querySelectorAll('#lovestorelist>.store_detail')
                console.log(listlen)
                for (var i = 0; i < listlen.length; i++) {
                    console.log(i)
                    console.log(listlen[i].scrollHeight)
                    console.log(listlen[i].offsetHeight)
                    // sum += parseInt(listlen[i].scrollHeight);
                    sum += parseInt(listlen[i].scrollHeight) + parseInt(margbtm);

                };

                var marginBtom = getComputedStyle(listlen[0]).marginBottom;
                console.log(marginBtom)

                var margbtm = marginBtom.substr(0, marginBtom.length - 2);
                
                //sum = sum - parseInt(marginBtom);
                console.log(sum)
                console.log(window.screen.height)
                var mq = window.matchMedia("(max-width: 600px)");                   
                if (sum < window.screen.height) {
                    if(!mq.matches){
                        console.log("當視窗寬度>600px時執行")
                        console.log("資料<window.screen.height，不要scroll")
                        s_list.style.height = sum+"px";
                        s_list.parentElement.style.height = "unset";
                    }else{
                        console.log("當視窗寬度<1/2H時執行")
                        if (sum <  (window.screen.height/2)){
                            s_list.style.height =  "unset";
                        }                   
                    }
                }else{
                    console.log("資料SUM多於window.screen.height，scroll")
                    if(!mq.matches){
                        console.log("當視窗寬度>600px時執行")
                        console.log("資料<window.screen.height，不要scroll")
                        s_list.style.height = sum+"px";
                        s_list.parentElement.style.height = "unset";
                    }else{
                        console.log("當視窗寬度<600px時執行")
                    }
                }
            }
            
            s_list.scrollTo(0,0)
            map.addLayer(markers);

        }else {
            s_list.innerHTML ="no data"
            // s_list.parentNode.style.height="100px"
            console.log("no data")

            const mq = window.matchMedia("(max-width: 600px)");                   
                if(!mq.matches){
                    console.log("*當視窗寬度>600px時執行")
                    s_list.style.height = "100px";
                    s_list.parentElement.style.height = "unset";
                }else{
                    console.log("*當視窗寬度<600px時執行")
                }
        }

        //應該是每次checkbox  都要測試
        function justifyHeight() {  
            const mq = window.matchMedia("(max-width: 600px)");                   
            if(!mq.matches){
                console.log("*當視窗寬度>600px時執行")
                s_list.style.height = "100px";
                s_list.parentElement.style.height = "unset";
            }else{
                console.log("*當視窗寬度<600px時執行")
            }
        }

        



    }
