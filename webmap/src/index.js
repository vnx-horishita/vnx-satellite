import * as maplibregl from "maplibre-gl";
import * as pmtiles from "pmtiles";
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

const categoryNames = ["CounterDisaster","AsahiKasei","DNP","Kajima","NEC","Nintendo","NipponPaper","Nissan","Omron","Sharp","TORAY","Toshiba"];
const slidetypes = ["経年積上","単年ごと"];
let target_slidetype = 0;
let flag_slidetype = "経年積上";
const colorNames = ["Standard","Glow","Heatmap"];
const colors_chart = ['#ff6347', '#87cefa'];
const colors_heat1 = ['interpolate',['linear'],['heatmap-density'],0,'transparent', 0.3,'transparent', 0.32,'#004263', 0.38,'#004263', 0.45,'#00596f', 0.48,'#00596f', 0.55, '#6b6b6b', 0.68, '#6b6b6b', 0.75, '#e4b67c', 0.88, '#e4b67c', 0.95, '#ffffe3'];
const colors_heat2 = ['interpolate',['linear'],['heatmap-density'],0,'transparent', 0.25, '#00336f', 0.4, '#00596f', 0.5, '#6b6b6b', 0.8, '#e4b67c', 1, '#ffffe3'];
const colors_heat3 = ['interpolate',['linear'],['heatmap-density'],0,'transparent', 0.25, '#08519c', 0.4, '#abdda4', 0.5, '#ffffbf', 0.8, '#fdae61', 1, '#d7191c'];
//const colors_heat2 = ['interpolate',['linear'],['heatmap-density'],0,'transparent', 0.25, '#0078bd', 0.4, '#00a0d1', 0.5, '#79cdd8', 0.8, '#b4c78f', 1, '#ff4500'];
const colors_option = [colors_heat1, colors_heat2, colors_heat3];
let target_colortheme = 0;
const target_Name = (location.hash ? location.hash.slice(1) : categoryNames[0]);
const listingPOl = document.getElementById('feature-list');
let target_year = view_param.year2 - view_param.year1 - 1;
const selected_range = document.getElementById('slider');
const label_name = document.getElementById('nLabel');
label_name.textContent = view_param.name;
const label_range = document.getElementById('sLabel');
label_range.textContent = view_param.year1 + '年～' + view_param.year2 + '年';

const playButton = document.getElementById('playButton');
const stopButton = document.getElementById('stopButton');
let timer; //タイマーを格納する変数
let currentValue;

playButton.addEventListener('click', function() {
    currentValue = parseInt(selected_range.value); //現在の値を格納する変数
    //年次が上限の状態で再生ボタンを押した場合は最初の年次から再生する
    if (currentValue = selected_range.max) {
        currentValue = selected_range.min;
    }

    // 既にタイマーが動作していたら停止
    if (timer) {
        clearInterval(timer);
    }

    // タイマーを設定してスライダーの値を更新
    timer = setInterval(function() {
        if (currentValue < parseInt(selected_range.max)) {
            currentValue++;
            selected_range.value = currentValue;
            updateLabel(currentValue);
            slider.dispatchEvent(new Event('input')); // inputイベントを発火
        } else {
            clearInterval(timer); // 最大値に達したら停止
        }
    }, 500); // 0.5秒ごとに更新
});

stopButton.addEventListener('click', function() {
    if (timer) {
        clearInterval(timer); // タイマーを停止
        currentValue = parseInt(selected_range.value); // 現在のスライダーの値を保存
    }
});

// ラベルを更新する関数
function updateLabel(value) {
    const label = document.getElementById('sLabel');
    label.textContent = view_param.year1 + '年～' + value + '年';
}

const categoryLength = categoryNames.length;
for (let i = 0; i < categoryLength; i++) {
    const selectCategory = document.getElementById('category-id');
    const optionName = document.createElement('option');
    //optionName.value = categoryNames[i];
    optionName.value = '#' + categoryNames[i];
    optionName.textContent = categoryNames[i];
    if (categoryNames[i] === target_Name) {
        optionName.selected = true;
    }
    selectCategory.appendChild(optionName);
}

const colorthemeLength = colorNames.length;
for (let i = 0; i < colorthemeLength; i++) {
    const selectColortheme = document.getElementById('color-id');
    const optionColorName = document.createElement('option');
    optionColorName.value = colorNames[i];
    optionColorName.textContent = colorNames[i];
    if (colorNames[i] === "Standard") {
        optionColorName.selected = true;
    }
    selectColortheme.appendChild(optionColorName);
}

const slidetypeLength = slidetypes.length;
for (let i = 0; i < slidetypeLength; i++) {
    const selectSlideType = document.getElementById('slidetype-id');
    const optionSlideType = document.createElement('option');
    optionSlideType.value = slidetypes[i];
    optionSlideType.textContent = slidetypes[i];
    if (slidetypes[i] === "経年積上") {
        optionSlideType.selected = true;
    }
    selectSlideType.appendChild(optionSlideType);
}

const init_coord = [0, 0];
const init_zoom = view_param.initZoom - 1;
const init_bearing = 0;
const init_pitch = 0;

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles",protocol.tile);

function renderListings(features) {
    const listingBox = document.createElement('h3');
    listingPOl.innerHTML = '';
    
    if (features.length) { 
        listingBox.textContent = 'マップ中央付近の文献サンプル';
        listingPOl.appendChild(listingBox);
        for (const feature of features) {
            const itemLink = document.createElement('a');
            itemLink.textContent = '［↗］';
            const hline = document.createElement('hr');
            const label = document.createElement('p');
            itemLink.href = 'https://tr.xlus.net/pec/view?no='+`${feature.properties.ID}`+'&year='+`${feature.properties.year}`;
            itemLink.target = '_blank';
            label.textContent = `${feature.properties.Title} (${feature.properties.year}, ${feature.properties.Affiliation})`;
            label.appendChild(itemLink);
            listingPOl.appendChild(hline);
            listingPOl.appendChild(label);
        }
    } else {
        listingBox.textContent = 'マップ中央付近にサンプル文献がありません。';
        listingPOl.appendChild(listingBox);
    }
}

const map = new maplibregl.Map({
    container: 'map',
    style: {"version":8,"name":"blank","center":[0,0],"zoom":1,"bearing":0,"pitch":0,"sources":{"plain":{"type":"vector","url":""}},"sprite":"","glyphs":"./app/fonts/{fontstack}/{range}.pbf","layers":[{"id":"background","type":"background","paint":{"background-color":"#07042F"}}],"id":"blank"},//#191970 #f0f8ff
    localIdeographFontFamily: ['sans-serif'],
    center: init_coord,
    //center: [viewset_hash[2],viewset_hash[1]],
    zoom: init_zoom,
    //zoom: viewset_hash[0],
    minZoom: 4,
    maxZoom: 15,
    maxBounds: [[-50.0000, -10.0000],[50.0000, 25.0000]],
    bearing: init_bearing,
    pitch: init_pitch,
    interactive: true,
    dragRotate: true,
    touchPitch: true,
    pitchWithRotate: true,
    doubleClickZoom: true,
    maplibreLogo: false,
    attributionControl:false
});

map.addControl(new maplibregl.NavigationControl({showCompass:true, showZoom:true, visualizePitch:true}, 'top-left'));

map.on('load', function () {
    map.addSource('doc_simple', {
        "type": 'vector',
        "url": 'pmtiles://app/data/' + target_Name + '/doc_simple.pmtiles',
        "minzoom": 4,
        "maxzoom": view_param.maxZoom1,//6
        "cluster": true,
        "clusterMaxZoom": 4,
        "clusterRadius": 2
    });
    map.addSource('doc_text', {
        'type': 'vector',
        "url": 'pmtiles://app/data/' + target_Name + '/doc_text.pmtiles',
        "minzoom": 4,
        "maxzoom": view_param.maxZoom2,//9 11
    });
    map.addSource('area_label', {
        'type': 'geojson',
        'data': './app/data/' + target_Name + '/label.geojson',
    });

    map.addLayer({
        'id': 'doc_point',
        'type': 'circle',
        'source': 'doc_text',
        'source-layer': 'doc',
        'minzoom': 4,
        'maxzoom': 15,
        'layout': {
            'visibility': 'visible',
            'circle-sort-key': ['get','year'],//年数が直近のものが上に表示されるように制御（リスト表示にも反映される）
        },
        'paint': {
            'circle-color': 'transparent',
            'circle-radius': 8,
        }
    });
    
    map.addLayer({
        'id': 'doc_info',
        'type': 'circle',
        'source': 'doc_text',
        'source-layer': 'doc',
        'minzoom': 9,
        'maxzoom': 15,
        'layout': {
            'visibility': 'visible',
            'circle-sort-key': ['get','year'],
        },
        'paint': {
            'circle-color': '#ffffe3',
            'circle-radius': 8,
            'circle-blur': ['interpolate',['linear'],['zoom'],9,3,12,1,15,0],//ズームによって段々3～0に近づく仕様に変更
            'circle-opacity': ['interpolate',['linear'],['zoom'],9,0.4,12,0.8,15,1]//ズームによって段々0.4～1に近づく仕様に変更
        }
    });
    
    map.addLayer({
        'id': 'doc_heat',
        'type': 'heatmap',
        'source': 'doc_simple',
        'source-layer': 'doc',
        'minzoom': 4,
        'maxzoom': 12,
        'layout': {
            'visibility': 'visible',
        },
        'paint': {
            'heatmap-weight': ['get','point_count'],
            'heatmap-intensity': ['interpolate',['linear'],['zoom'],4,0.1,7,0.5,12,1],//4,0.1,12,1
            //'heatmap-color': ['interpolate',['linear'],['heatmap-density'],0,'transparent', 0.25, '#00336f', 0.5, '#7d7c78', 0.75, '#D9CD91', 1, '#FFFD7A'],
            'heatmap-color': colors_heat1,
            'heatmap-radius': ['interpolate',['linear'],['zoom'],4,view_param.heatRadius1,7,view_param.heatRadius2,12,view_param.heatRadius3],
            'heatmap-opacity': ['interpolate',['linear'],['zoom'],4,1,12,0.9]
        },
    });
    
    map.addLayer({
        'id': 'area_label_1',
        'type': 'symbol',
        'source': 'area_label',
        'maxzoom':8.5,//9.5
        'filter': ['<=', view_param.labelSize1, ["get", "size1"]],
        'layout': {
            'icon-image': '',
            'visibility': 'visible',
            'text-field': '{label}',
            'text-font': ["NotoSans-Regular"],
            'text-size': 12,
            'text-offset': [0, 1.5],
            'text-anchor': 'center',
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'symbol-sort-key': ["get", "size1"]
        },
        'paint':{
            'text-color': '#07042F', 'text-halo-color':'#fff', 'text-halo-width':2
        }
    });
    map.addLayer({
        'id': 'area_label_2',
        'type': 'symbol',
        'source': 'area_label',
        'minzoom':8.5,
        'layout': {
            'icon-image': '',
            'visibility': 'visible',
            'text-field': '{label}',
            'text-font': ["NotoSans-Regular"],
            'text-size': 12,
            'text-offset': [0, 1.5],
            'text-anchor': 'center',
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'symbol-sort-key': ["get", "size1"]
        },
        'paint':{
            'text-color': '#07042F', 'text-halo-color':'#fff', 'text-halo-width':2
        }
    });
    map.addLayer({
        'id': 'label_pseudo',//円グラフ生成用の擬似的なレイヤ
        'source': 'area_label',
        'type': 'circle',
        //'filter': ['<=', view_param.labelSize1, ["get", "size1"]],
        "minzoom": 4,
        "maxzoom": 15,
        'layout': {
            'visibility': 'none',
            'circle-sort-key': ["get", "size1"]
        },
        'paint': {
            'circle-color': 'transparent',
            'circle-stroke-color':'transparent',
            'circle-radius': 1
        },
    });

    map.on('moveend', generateList);
    //map.on('moveend', updateMarkers);
    map.zoomIn({duration: 1000});
    
    const selected_category = document.querySelector('.category-select');
    selected_category.addEventListener('change', function(){
        window.location.hash = this.value;
    });

    const selected_slidetype = document.querySelector('.slidetype-select');
    selected_slidetype.addEventListener('change', function(){
        target_slidetype = selected_slidetype.selectedIndex;
        flag_slidetype = slidetypes[target_slidetype];
    });

    const selected_colortheme = document.querySelector('.color-select');
    selected_colortheme.addEventListener('change', function(){
        target_colortheme = selected_colortheme.selectedIndex;
        map.setPaintProperty('doc_heat', 'heatmap-color', colors_option[target_colortheme]);
    });

    selected_range.addEventListener('input', function(){
        target_year = Number(selected_range.value);
        if (flag_slidetype === "経年積上") {
            this.style.background = "#777";
            label_range.textContent = view_param.year1 + '年～' + selected_range.value + '年';
            map.setFilter('doc_heat', ['>=', target_year, ["get", "year"]]);
            map.setFilter('doc_info', ['>=', target_year, ["get", "year"]]);
            map.setFilter('doc_point', ['>=', target_year, ["get", "year"]]);
            // スライダーでの選択範囲を色変えする
            const max = this.max;
            const min = this.min;
            const val = this.value;
            const percent = ((val - min) / (max - min)) * 100;
            this.style.background = `linear-gradient(to right, #eee ${percent}%, #777 ${percent}%)`;
        } else {
            label_range.textContent = '      ' + selected_range.value + '年';
            map.setFilter('doc_heat', ['==', target_year, ["get", "year"]]);
            map.setFilter('doc_info', ['==', target_year, ["get", "year"]]);
            map.setFilter('doc_point', ['==', target_year, ["get", "year"]]);
            this.style.background = "#777";
        }
        generateList();
    });
});

//円グラフマーカーの設置 (see -> https://maplibre.org/maplibre-gl-js/docs/examples/cluster-html/)
const markers = {};
let markersOnScreen = {};

function updateMarkers() {
    const targetZoom = map.getZoom();
    let targetArea;
    if (targetZoom <= 8.5) {
        targetArea = ['<=', view_param.labelSize1, ["get", "size1"]]
    } else {
        targetArea = ['<=', 0, ["get", "size1"]]
    };
    const newMarkers = {};
    const features = map.queryRenderedFeatures({layers: ['label_pseudo'], filter:targetArea});
    
    for (let i = 0; i < features.length; i++) {
        const coords = features[i].geometry.coordinates;
        const props = features[i].properties;
        //if (!props.clustered) continue;
        const id = props.ID + '_' + props.size1;

        let marker = markers[id];
        if (!marker) {
            const el = createDonutChart(props);
            marker = markers[id] = new maplibregl.Marker({
                element: el, 
                //offset: [0,-18]
                anchor: 'bottom'
            }).setLngLat(coords);
        }
        newMarkers[id] = marker;
        if (!markersOnScreen[id]) marker.addTo(map);
    }
    // for every marker we've added previously, remove those that are no longer visible
    for (let id in markersOnScreen) {
        if (!newMarkers[id]) markersOnScreen[id].remove();
    }
    markersOnScreen = newMarkers;
}

//Create a legend based on the displayed layer 
const ta_legend = document.getElementById('ta-legend')
let legendContent;

function generateLegend() {
    legendContent = '';
    if (map.queryRenderedFeatures({layers: ['label_pseudo']})[0] !== undefined){
        legendContent += '<p>' +
        `
        <svg width="28" height="28" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" overflow="hidden"><defs><clipPath id="clip0"><rect x="1159" y="256" width="28" height="28"/></clipPath><clipPath id="clip1"><rect x="1159" y="256" width="28" height="28"/></clipPath><clipPath id="clip2"><rect x="1160" y="259" width="23" height="24"/></clipPath><clipPath id="clip3"><rect x="1160" y="259" width="23" height="24"/></clipPath></defs><g clip-path="url(#clip0)" transform="translate(-1159 -256)"><g clip-path="url(#clip1)"><g clip-path="url(#clip2)"><path d="M1171.99 260.134C1178.1 260.134 1183.06 265.092 1183.06 271.208L1176.42 271.208C1176.42 268.762 1174.43 266.779 1171.99 266.779Z" stroke="#FFFFFF" stroke-width="1.14583" stroke-linecap="butt" stroke-linejoin="round" stroke-miterlimit="10" stroke-opacity="1" fill="${colors_chart[0]}" fill-rule="evenodd" fill-opacity="1"/></g><g clip-path="url(#clip3)"><path d="M1183.06 271.208C1183.06 277.324 1178.1 282.282 1171.99 282.282 1165.87 282.282 1160.91 277.324 1160.91 271.208 1160.91 265.092 1165.87 260.134 1171.99 260.134L1171.99 266.779C1169.54 266.779 1167.56 268.762 1167.56 271.208 1167.56 273.655 1169.54 275.638 1171.99 275.638 1174.43 275.638 1176.42 273.655 1176.42 271.208Z" stroke="#FFFFFF" stroke-width="1.14583" stroke-linecap="butt" stroke-linejoin="round" stroke-miterlimit="10" stroke-opacity="1" fill="${colors_chart[1]}" fill-rule="evenodd" fill-opacity="1"/></g></g></g></svg>
        `
        +'<br>領域内件数及び<br>2020年以降比率</p>';
    } else {
        legendContent += '<p>表示対象なし</p>';
    }
    ta_legend.innerHTML = legendContent;
}
// after the GeoJSON data is loaded, update markers on the screen and do so on every map move/moveend
map.on('data', (e) => {
    if (e.sourceId !== 'area_label' || !e.isSourceLoaded) return;
    map.on('moveend', updateMarkers);
    updateMarkers();
    generateLegend();
});

function generateList () {
   const center = map.getCenter();
   const point = map.project(center);
   const bbox = [
       [point.x - 20, point.y - 20],
       [point.x + 20, point.y + 20]
   ];
   const extentPOI = map.queryRenderedFeatures(bbox, { layers: ['doc_point'] });
   renderListings(extentPOI);
}

//SVG円グラフの生成機能
function createDonutChart(props) {
    const offsets = [];
    const counts = [props.size2, props.size1 - props.size2];
    let total = 0;
    
    for (let i = 0; i < counts.length; i++) {
        offsets.push(total);
        total += counts[i];
    }

    const fontColor = "black";
    const fontSize = total >= 80 ? 16 : total >= 40 ? 14 : total >= 20 ? 12 : 10;
    const r = total >= 100 ? 24 : total >= 60 ? 22 : total >= 40 ? 20 : total >= 30 ? 18 : total >= 25 ? 15 : 12;
    const r0 = Math.round(r * 0.6);
    const w = r * 2;
    
    let html =
        `<div><svg width="${
            w
        }" height="${
            w
        }" viewbox="0 0 ${
            w
        } ${
            w
        }" text-anchor="middle" style="font: ${
            fontSize
        }px sans-serif; fill: ${fontColor}; display: block">`;

    for (let i = 0; i < counts.length; i++) {
        html += donutSegment(
            offsets[i] / total,
            (offsets[i] + counts[i]) / total,
            r,
            r0,
            colors_chart[i]
        );
    }
    html +=
        `<circle cx="${
            r
        }" cy="${
            r
        }" r="${
            r0
        }" fill="white" /><text dominant-baseline="central" transform="translate(${
            r
        }, ${
            r
        })">${
            total.toLocaleString()
        }</text></svg></div>`;

    const el = document.createElement('div');
    el.innerHTML = html;
    return el.firstChild;
}

function donutSegment(start, end, r, r0, color) {
    if (end - start === 1) end -= 0.00001;
    const a0 = 2 * Math.PI * (start - 0.25);
    const a1 = 2 * Math.PI * (end - 0.25);
    const x0 = Math.cos(a0),
        y0 = Math.sin(a0);
    const x1 = Math.cos(a1),
        y1 = Math.sin(a1);
    const largeArc = end - start > 0.5 ? 1 : 0;

    return [
        '<path d="M',
        r + r0 * x0,
        r + r0 * y0,
        'L',
        r + r * x0,
        r + r * y0,
        'A',
        r,
        r,
        0,
        largeArc,
        1,
        r + r * x1,
        r + r * y1,
        'L',
        r + r0 * x1,
        r + r0 * y1,
        'A',
        r0,
        r0,
        0,
        largeArc,
        0,
        r + r0 * x0,
        r + r0 * y0,
        `" fill="${color}" fill-opacity="0.8"/>`
    ].join(' ');
}

map.on('click', function (e){
    const query_point = map.queryRenderedFeatures(e.point, { layers: ['doc_point']})[0] !== undefined ? map.queryRenderedFeatures(e.point, { layers: ['doc_point']}) : "no-layer";
    if (query_point !==  "no-layer") {
        let popupContent = '';
        popupContent += '<table class="tablestyle02"><tr><th class="main">Contents</th></tr>';
        query_point.forEach(function (feat){
            popupContent += '<tr><td class="main"><details><summary>' + feat.properties["Title"] + '(' + feat.properties["year"] + ', ' + feat.properties["Affiliation"] + ')</summary><p class="remarks"><a href="https://tr.xlus.net/pec/view?no=' + feat.properties["ID"] + '&' + feat.properties["year"] + '" target="_blank">詳細リンク</a></p>' + feat.properties["Abstract"] + '</details></td></tr>';
        });
        popupContent += '</table>';

        new maplibregl.Popup({closeButton:true, focusAfterOpen:false, className:'t-popup', maxWidth:'540px', anchor:'bottom'}).setLngLat(e.lngLat).setHTML(popupContent).addTo(map);
    }
    map.panTo(e.lngLat, {duration:1000});
});

document.getElementById('labelButton').style.backgroundColor = "white";
document.getElementById('labelButton').style.color = "black";

document.getElementById('listButton').style.backgroundColor = "white";
document.getElementById('listButton').style.color = "black";

document.getElementById('chartButton').style.backgroundColor = "#999";
document.getElementById('chartButton').style.color = "white";

document.getElementById('feature-list').style.display ="block";
document.getElementById('ta-legend').style.display ="none";

document.getElementById('chartButton').addEventListener('click', function () {
    const visibility01 = map.getLayoutProperty('label_pseudo', 'visibility');
    const visibility02 = document.getElementById('ta-legend');
    if (visibility01 === 'visible') {
        map.setLayoutProperty('label_pseudo', 'visibility', 'none');
        visibility02.style.display = 'none';
        this.style.backgroundColor = "#999";
        this.style.color = "white"
    }
    else {
        map.setLayoutProperty('label_pseudo', 'visibility', 'visible');
        visibility02.style.display = 'block';
        this.style.backgroundColor = "white";
        this.style.color = "black";
    }
});

document.getElementById('listButton').addEventListener('click', function () {
    const visibility01 = document.getElementById('feature-list');
    const visibility02 = document.getElementById('icon-center');
    if (visibility01.style.display == 'block') {
        visibility01.style.display = 'none';
        visibility02.style.display = 'none';
        this.style.backgroundColor = "#999";
        this.style.color = "white"
    }
    else {
        visibility01.style.display = 'block';
        visibility02.style.display = 'block';
        this.style.backgroundColor = "white";
        this.style.color = "black";
    }
});

document.getElementById('labelButton').addEventListener('click', function () {
    const visibility = map.getLayoutProperty('area_label_1', 'visibility');
    if (visibility === 'visible') {
        map.setLayoutProperty('area_label_1', 'visibility', 'none');
        map.setLayoutProperty('area_label_2', 'visibility', 'none');
        this.style.backgroundColor = "#999";
        this.style.color = "white"
    } else {
        map.setLayoutProperty('area_label_1', 'visibility', 'visible');
        map.setLayoutProperty('area_label_2', 'visibility', 'visible');
        this.style.backgroundColor = "white";
        this.style.color = "black";
    }
});

//Reload when hash-value changed
window.onhashchange = function(){
    location.reload();
}
