var gmap, markersArray, openInfowindow, markerCluster

function setUp() {
    markersArray = [];
    CENTER = new google.maps.LatLng(54.3843, -3);
    options = {
                zoom: 6,
                center: CENTER,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
    gmap = new google.maps.Map(document.getElementById("mapbox"), options);
    markerCluster = new MarkerClusterer(gmap, []);
};

$('#cumlative').change(function() {
    // Refresh the slider position
    $('#date_slider').slider("value", $('#date_slider').slider("value"));
})


$('#date_slider').slider({ 
    range: 'max',
    min: 1251763241,
    max: 1305889167,
    step: 86400,
    change: function(event, ui) { 
        updateDate(ui.value);
        clearOverlays();
        // range is plus/minus 12 hours
        range_max = ui.value + 43200;


        if ($('#cumlative').attr('checked')) {
            range_min = 1251763241;
        } else {
            range_min = ui.value - 43200;
        }

        $.getJSON('/node/date_range/'+range_min+'/'+range_max+'/', function(data) {
            for (key in data) {
                addMarker(data[key]);
            }
            markerCluster.addMarkers(markersArray)
        });

        $.getJSON('/node/news_date_range/'+0+'/'+range_max+'/', function(data) {
            updateNewsList(data)
        });
    }
});

function getNewsItem(v) {
    cached_item = localStorage.getItem(v.cleaned_value);
    if (cached_item) {
        item = new Object();
        item.title = cached_item;
        $('#news-'+v.cleaned_value).html(tim("template-news-item", item))
    } else {
        $.getJSON('/node/get_single/'+v.value, function(item) {
            $('#news-'+v.cleaned_value).html(tim("template-news-item", item))
            cached_item = localStorage.setItem(v.cleaned_value, item.title);
        });        
    }
}

function updateNewsList(data) {
    $('#pressbox').html('')
    var items = [];
    $.each(data, function(index, value) {
        v = new Object();
        v.cleaned_value = value.replace(/:/g, '-')
        v.value = value
        $('#pressbox').prepend(tim("template-news-placeholder", v))
        getNewsItem(v)
    });
}

function updateDate(timestamp) {
    var date = new Date(timestamp*1000);
    $('.signups_date').html(date.getDate() + '/' + date.getMonth()+'/'+date.getFullYear());
}

function addMarker(key) {
    try {
        
        result_location = key.split('--')[2].split('x');
        var latlng = new google.maps.LatLng(result_location[0], result_location[1]);
        var marker = new google.maps.Marker({position: latlng,});
        marker.key = key;
        
        markersArray.push(marker);
    
        google.maps.event.addListener(marker, 'click', function() {
                if (openInfowindow){
                    openInfowindow.close();
                }
            
                $.getJSON('/node/get_single/' + marker.key, function(data) {
                    openInfowindow = marker.infowindow || (marker.infowindow = new google.maps.InfoWindow());
                    openInfowindow.setContent(tim("template-infowindow", data));
                    openInfowindow.open(gmap, marker);
                });
            });
    } catch(err) {
        console.debug(key);
    }
};

function clearOverlays() {
    markerCluster.clearMarkers();
    markerCluster.resetViewport();
    markersArray = [];
}



google.load("visualization", "1", {packages:["imagesparkline"]});
google.setOnLoadCallback(drawChart);

function drawChart() {
    var linedata = new google.visualization.DataTable();
    linedata.addColumn("number");

    $.getJSON('/node/day_buckets', function(data) {
        // console.debug(data[0])
        linedata.addRows(data.length+1);
        for (i=0;i<data.length;i++) {
            linedata.setValue(i,0,data[i])
        }
        var chart = new google.visualization.ImageSparkLine(document.getElementById('chart_div'));
        chart.draw(linedata, {width: 1000, height: 50, showAxisLines: false,  showValueLabels: false, labelPosition: false});
        setUp();
        
    });
}

var sliderPlaying = false;

function playSlider() {
    if (sliderPlaying==true) {
        currentValue = $('#date_slider').slider("value");
        step = 86400;
        $('#date_slider').slider("value", currentValue+step);
        setTimeout(playSlider, 1000);
    }
}

$('.playpause').click(function() {
    $('.playpause').toggleClass('playing');
    if (sliderPlaying==false) {
        sliderPlaying = true;
        playSlider();
    } else {
        sliderPlaying = false;
        clearTimeout();
    }
    return false;
});