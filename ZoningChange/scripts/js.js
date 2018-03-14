var map;
var parcels;
var clicked = [];
var intersected = [];
var buffered;
var intParcels;
var opposedLayer;
var supportLayer;
var bufferArea;
var pct = [0, 100]

$(document).ready(function () {
    $("#config").on("click", function () {
        config.dialog.dialog("open");
    });

    $('.click').click(function (event) {
        $('.click').removeClass('orange');
        $('#' + event.target.id).addClass('orange')
        $('.click').attr('data-selected', 'false');
        $('#' + event.target.id).attr('data-selected', 'true');
    });

    var default_settings = {
        inner_dist: 200,
        outer_dist: 300,
        parcel_url: 'https://mapit.tarrantcounty.com/arcgis/rest/services/Dynamic/TADParcels/MapServer/0',
        parcel_OID: 'OBJECTID',
        view: {
            center: [32.93, -97.22],
            zoom: 17
        }
    };

    config.init(default_settings, function () {
        map = L.map('mapid').setView(config.settings.view.center, config.settings.view.zoom);

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox.streets',
            accessToken: 'pk.eyJ1IjoiYnJ1bGVjIiwiYSI6IlpEOGRJVkUifQ.SDYry6LIIHfMMpajIkFCAg'
        }).addTo(map);

        parcels = L.esri.featureLayer({
            url: config.settings.parcel_url,
            style: style,
            onEachFeature: onEachFeature,
            minZoom: 16
        }).addTo(map);

        opposedLayer = L.geoJson(null, { style: opposedStyle }).addTo(map);
        supportLayer = L.geoJson(null, { style: supportStyle }).addTo(map);
    });

});

function style() {
    return {
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.1,
        fillColor: 'white'
    };
}

function intersectedStyle() {
    return {
        weight: 3,
        opacity: 1,
        color: 'orange',
        dashArray: '3',
        fillOpacity: 0.1,
        fillColor: 'white'
    };
}

function opposedStyle() {
    return{
        weight: 5,
        color: '#1AD4D7',
        dashArray: '',
        fillOpacity: 0.7,
        fillColor: '#ff0000'
    };
}

function supportStyle() {
    return{
        weight: 5,
        color: '#1AD4D7',
        dashArray: '',
        fillOpacity: 0.7,
        fillColor: '#008000'
    };
}

function highlightFeature(e) {
    var layer = e.target;
    if (clicked.indexOf(e.target.feature.id) < 0 && intersected.indexOf(e.target.feature.id) < 0) {
        layer.setStyle({
            weight: 5,
            color: '#1AD4D7',
            dashArray: '',
            fillOpacity: 0.7,
            fillColor: '#A7ECED'
        });
    }
    else if ($('#support').attr("data-selected") === 'true') {
        layer.setStyle(supportStyle());
    }
    else if ($('#opposed').attr("data-selected") === 'true') {
        layer.setStyle(opposedStyle());
    }
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

function resetHighlight(e) {
    var layer = e.target;
    if (clicked.indexOf(e.target.feature.id) < 0 && intersected.indexOf(e.target.feature.id) < 0) {
        layer.setStyle({
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.1,
            fillColor: 'white'
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }
    else if ($('#support').attr("data-selected") === 'true' || $('#opposed').attr("data-selected") === 'true') {
        layer.setStyle({
            weight: 3,
            color: 'orange',
            dashArray: '3',
            fillOpacity: 0.1,
            fillColor: 'white'

        });
    }
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: clickedFeature
    });
}

function onEachIntersectedFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: clickedIntersectedFeature
    });
}

function clickedFeature(e) {
    if ($('#buf').attr("data-selected") === 'true') {
        layer = e.target;

        if (typeof bufLyr !== 'undefined') {
            map.removeLayer(bufLyr);
            map.removeLayer(intParcels);
            parcels.resetStyle();
        }

        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7,
            fillColor: 'orange'
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
        clicked.push(e.target.feature.id);

        var poly = turf.polygon([layer.feature.geometry.coordinates[0]])
        distance = parseInt(config.settings.inner_dist);
        buffered = turf.buffer(poly, distance, { units: 'feet' });
        bufferArea = turf.convertArea(turf.area(buffered), 'meters', 'feet');
        bufLyr = L.geoJson(buffered).addTo(map);

        parcels.query()["intersects"](buffered).ids(function (error, ids) {
            intersected = ids;
            OIDs = ids.join();

            intParcels = L.esri.featureLayer({
                url: config.settings.parcel_url,
                where: config.settings.parcel_OID + " IN (" + OIDs + ")",
                style: intersectedStyle,
                onEachFeature: onEachIntersectedFeature,
                minZoom: 16
            }).addTo(map);
        });
        var bbox = turf.bbox(buffered);
        var bounds = [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
        map.fitBounds(bounds);
        calcData();
    }
}

function clickedIntersectedFeature(e) {
    if ($('#opposed').attr("data-selected") === 'true') {
        var clipped = turf.intersect(e.target.feature, buffered)
        if (clipped) {
            opposedLayer.addData(clipped);
            calcData(turf.convertArea(turf.area(clipped), 'meters', 'feet'))
        }    
    }
    else if ($('#support').attr("data-selected") === 'true') {
        var clipped = turf.intersect(e.target.feature, buffered)
        if (clipped) {
            supportLayer.addData(clipped);
            calcData(null, turf.convertArea(turf.area(clipped), 'meters', 'feet'))
        }
    }
}

function calcData(opposed) {
    if (opposed) {
        var percent = roundToTwo(opposed / bufferArea * 100);
        var opposed = roundToTwo(pct[0] + percent) > 100 ? 100 : roundToTwo(pct[0] + percent);
        var support = roundToTwo(pct[1] - percent) < 0 ? 0 : roundToTwo(pct[1] - percent);
        pct[0] = opposed;
        pct[1] = support;
        $('#opposedArea').text(opposed + '%');
        $('#supportArea').text(support + '%');
        if (opposed > 20) {
            $('#opposedArea').removeClass('nums');
            $('#opposedArea').addClass('redNums');
        }
    }
    else {
        pct[0] = 0;
        pct[1] = 100
        $('#totalArea').text(roundToTwo(turf.convertArea(bufferArea, 'feet', 'acres')));
        $('#opposedArea').text('0%');
        $('#supportArea').text('100%');
    }
    chartData.datasets[0].data = pct;
    myDoughnutChart.update();
}

//chart stuff
var chartData = {
    datasets: [{
        data: [0, 100],
        backgroundColor: ['#ff3333', '#339933', 'orange']
    }],

    // These labels appear in the legend and in the tooltips when hovering different arcs
    labels: ['Opposed', 'Support']
};
var ctx = document.getElementById("myChart").getContext('2d');
ctx.canvas.width = 400;
ctx.canvas.height = 275;
var myDoughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: {responsive: false}
});


//config stuff
var config = {
    save: function (options) {
        $.extend(this.settings, options);
        localStorage.setItem("Config", JSON.stringify(this.settings));
        location.reload();
    },
    init: function (default_param, callback) {
        this.default_settings = default_param;
        var localConfig = JSON.parse(localStorage.getItem("Config"));
        if (localConfig) {
            this.settings = localConfig;
        } else {
            this.settings = $.extend({}, this.default_settings);
        }
        this.initForm();

        config.dialog.find("form").on("submit", function (event) {
            event.preventDefault();
            var options = config.readForm();
            config.save(options);
            config.dialog.dialog("close");
        });

        callback();
    },
    dialog: $("#dialog-form").dialog({
        autoOpen: false,
        height: 410,
        width: 450,
        modal: true,
        buttons: {
            "Save": function () {
                var options = config.readForm();
                config.save(options);
                config.dialog.dialog("close")
            },
            Cancel: function () {
                config.dialog.dialog("close")
            }
        },
        close: function () {
            $('.click').removeClass('orange');
        }
    }),
    readForm: function () {
        return {
            inner_dist: parseInt($("#distance1").val()),
            outer_dist: parseInt($("#distance2").val()),
            parcel_url: $("#parcel_url").val(),
            parcel_OID: $("#parcel_OID").val(),
            view: { center: map.getCenter(), zoom: map.getZoom() }
        };
    },
    initForm: function () {
        $("#distance1").val(this.settings.inner_dist);
        $("#distance2").val(this.settings.outer_dist);
        $("#parcel_url").val(this.settings.parcel_url);
        $("#parcel_OID").val(this.settings.parcel_OID);
    }
}

function roundToTwo(num) {
    return +(Math.round(num + "e+2") + "e-2");
}