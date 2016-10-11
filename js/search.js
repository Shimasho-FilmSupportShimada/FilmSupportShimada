var geojsondataList;
var i=0;

$(function() {
    var googleMap = createGoogleMaps(); //Google地図 生成
    settingStylesGoogleMaps(googleMap); //地図 スタイル設定



    // geoJson読み込み /////////////////////////////////////
    $.ajax({
        type: "GET",
        url: './data/film.json', //データのURL
        dataType: 'json',
        success: function(json_data) { //受信成功
            var geojsonData = getGeoJson(json_data); //受信データからGeoJsonを取り出す。
            addGeoJsonToGoogleMaps(googleMap, geojsonData); //オープンデータを地図に表示する。

            geojsondataList=json_data.features[1].geometry;
            setInterval(moveSymbols(geojsondataList,9),1000);

// var listView = document.getElementById("mapList");
// listView.innerText=geojsondataList.coordinates[0];

        },
        error: function(e) { //受信失敗
            window.alert('失敗しました!');
        }
    });

    // 現在地 begin //////////////////////////////////
    getGeoLocation();
    // 位置情報を取得する
    function getGeoLocation() {
        if (!navigator.geolocation) {
            return;
        } //位置情報に未対応のブラウザは終了
        navigator.geolocation.getCurrentPosition( //位置情報を取得する。高精度の位置情報はnavigator.geolocation.watchpositionを使用する。
            function(position) { //取得成功
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                googleMap.setCenter(pos); //地図の中央を現在地とする。
                addLocationMarker(googleMap, pos); //地図に現在地マーカーを追加する。
            },
            function(error) { //取得失敗
                var errMsg = "位置を特定できません。";
                if (error.code == 1) {
                    errMsg = errMsg + "\r\n" + "位置情報の取得が許可されていません。端末のGPS設定を有効にしてください。";
                } else if (error.code == 2) {
                    errMsg = errMsg + "\r\n" + "位置情報の取得が利用できません。";
//とりあえず、現在地表示error回避のため追加
                    var pos = {
                        lat: 34.825764,
                        lng: 138.137578
                    };
                    googleMap.setCenter(pos); //地図の中央を現在地とする。
                    addLocationMarker(googleMap, pos); //地図に現在地マーカーを追加する。
//45行目スタートのここまで
                } else if (error.code == 3) {
                    errMsg = errMsg + "\r\n" + "位置情報の取得がタイムアウトしました。電波の届きやすい屋外の広い場所に移動してください。";
                }
                window.alert(errMsg);
            }, { //オプション
                enableHighAccuracy: true, //位置の精度　true:高精度モード false:通常モード
                maximumAge: 10000 //位置情報のキャッシュ機能(単位ミリ秒)
            }
        );
    }
    // 地図に現在地マーカーを追加する
    var currentLocationMarker = null;

    function addLocationMarker(mapsObject, position) {
        if (currentLocationMarker == null) {
            var iconPath = "https://storage.googleapis.com/shizuokashi-road.appspot.com/opendata-api-wiki/icons/bluedot.png";
            var iconObject = {
                url: iconPath //アイコンのpath(必須)
            };
            currentLocationMarker = new google.maps.Marker({
                position: position,
                map: mapsObject,
                icon: iconObject,
                optimized: false,
                title: '現在地',
                visible: true,
                animation: google.maps.Animation.DROP
            });
        } else {
            currentLocationMarker.setPosition(position);
        }
    }
    // 現在地 end ////////////////////////////////////

    //
    //	Google地図
    //
    /////////////////////////////////////////////////////////
    //	Google地図の生成 ////////////////////////////////////
    function createGoogleMaps() {
        var mapOptions = { //地図の表示オプション
            zoom: 15, //地図の縮尺レベル:1～20
            center: new google.maps.LatLng(34.830236, 138.173419), //地図の初期位置(世界測地系の経緯度):島田駅
            mapTypeId: google.maps.MapTypeId.ROADMAP //地図の種類: ROADMAP=道路地図、SATELLITE=航空写真、TERRAIN=地形図
        };
        var mapsObject = new google.maps.Map(document.getElementById("map_canvas"), mapOptions); //地図を表示する
        return mapsObject;
    }
    //	Google地図のスタイル設定 ////////////////////////////
    function settingStylesGoogleMaps(mapsObject) {
        mapsObject.data.setStyle({
            //カスタムアイコン(URLを指定する) ↓
            icon: {
                url: "image/green-dot.png"
            },
            fillColor: "firebrick", //ポリゴンの色
            strokeColor: "blue" //ラインの色
        });
    }

    //	Google地図の情報ウィンドウ(バルーン)設定 ////////////
    function settingInfoWindowGoogleMaps(mapsObject) {
        var infoWindow = new google.maps.InfoWindow(); //情報ウィンドウを生成する
        google.maps.event.addListener(mapsObject.data, 'click', function(event) {
            var feature = event.feature; //図形を取得
            //情報ウィンドウに表示する情報を設定
            var content = "";
            // if (feature.getId() !== undefined) {
            // content = "<em>id: " + feature.getId() + "</em>" + "</br>";
            if (feature.forEachProperty) {
                feature.forEachProperty(function(value, name) {
                    content = content + "<b>" + name + "</b>:" + value + "</br>";
                });
            }
            infoWindow.setContent(content); //表示する情報を設定
            var anchor = new google.maps.MVCObject(); //表示基準(anchor)
            anchor.set("position", event.latLng); //座標設定
            infoWindow.open(mapsObject, anchor); //情報ウィンドウ表示
        });

    }

    //	Google地図のGeoJsonデータを読み込む /////////////////
    function addGeoJsonToGoogleMaps(mapsObject, geoJsonData) {
        clearSymbols(mapsObject); //表示中のデータを消去する
        mapsObject.data.addGeoJson(geoJsonData); //Google地図にGeoJsonデータを表示する。
        settingInfoWindowGoogleMaps(mapsObject);
    }

    //	Google地図のシンボル(マーカー、ライン、ポリゴン)を消去
    function clearSymbols(mapsObject, infoWindow) {
        mapsObject.data.forEach(function(f) {
            mapsObject.data.remove(f);
        }); //シンボル消去
        //if (infoWindow) {infoWindow.close();}                            // バルーンを閉じる
    }

    //	jsonデータからgeojsonを取り出す
    function getGeoJson(jsonData) {
        if (!jsonData) {
            return "{}";
        } //空白のjsonを戻す
        if (jsonData.Data !== undefined) {
            return jsonData.Data;
        } //GeoJsonを戻す。
        return jsonData; //その他のjsonを戻す。
    }

//ピンを移動させる
    function moveSymbols(jsonData,i) {
      var listView = document.getElementById("mapList");
      listView.innerText=jsonData.coordinates[i]+"  "+i;
      i++;
      // for(var i=0,i>=jsonData.features[1].geometry.length;i++){
      //   listView.innerText=jsonData.features[1].geometry.coordinates[i];
      // }
    }


});


(function moveiconLoop() {
    moveSymbols(geojsondataList);
    window.requestAnimationFrame(moveSymbols);
}());
