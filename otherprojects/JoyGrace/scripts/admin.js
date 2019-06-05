var page;
var newCode;

$(document).ready(function () {
    $('#loadScreen').show();
    $.get('../index.htm').then(function (responseData) {
        $('#newCode').html(responseData);
        page = responseData;
        var caro = $(page).find('.carousel-item');
        $(caro).each(function (index) {
            $(caroItems).append("<div id='item" + index + "' class='col-xs-1 col-lg-3'>" + caro[index].innerHTML + "<div class='row'><div class='col'><button id='btnDel" + index + "' type='button' class='btn btn-sm btn-block btn-secondary btnDel' onclick='delItem(" + index + ")'>Delete</button></div></div></div>");
        });
        $('#loadScreen').hide();
    });
    $(btnAdd).click(function () {
        UploadFile(true);
    })
    $(btnPublish).click(function () {
        Publish();
    })
    
});

function UploadFile() {
    $('#loadScreen').show();
    ///create a new FormData object
    var formData = new FormData(); //var formData = new FormData($('form')[0]);

    CallWebMethod("{ filename : '" + $('#file')[0].files[0].name + "'}", 'admin.aspx/GetUniqueFileName', function (result) {
        if (result) {
            formData.append('name', result);
            formData.append('file', $('#file')[0].files[0]);

            ///AJAX request
            $.ajax(
            {
                ///server script to process data
                url: "../FileUpload.ashx", //web service
                type: 'POST',
                complete: function () {
                    $(caroItems).prepend("<div class='col-xs-1 col-lg-3'>" + "<img src='../img/" + result + "' class='img-fluid items'/></div>");
                    $('#loadScreen').hide();
                },
                progress: function (evt) {
                    //progress event    
                },
                ///Ajax events
                beforeSend: function (e) {
                    //before event  
                },
                success: function (e) {
                    //success event
                },
                error: function (e) {
                    //errorHandler
                },
                ///Form data
                data: formData,
                ///Options to tell JQuery not to process data or worry about content-type
                cache: false,
                contentType: false,
                processData: false
            });
        }
    });
    
    

}

function WriteHTML(html) {
    $('#loadScreen').show();
    CallWebMethod('{"html":' + html + '}', 'admin.aspx/WriteHTML', function (result) {
        if (result > 0) {
            setTimeout(function () { window.location.href = '../'; }, 2000);
            
        }
    });
}
function Publish() {
    var newItems = $('#caroItems .items');
    var itemHTML = "<div id='caroInner' class='carousel-inner'>";
    $.each(newItems, function (i, val) {
        if (i === 0 ) {
            itemHTML += "<div class='carousel-item active'>" + val.outerHTML + "</div>";
        }
        else {
            itemHTML += "<div class='carousel-item'>" + val.outerHTML + "</div>";
        }   
    });
    itemHTML += "</div>";
    $('#caroInner').html(itemHTML);
    newCode = document.getElementById('newCode');
    WriteHTML(JSON.stringify(newCode.innerHTML.replace('<script type="text/javascript" async="" src="https://www.google-analytics.com/analytics.js"></script>', '')));
}

function delItem(i) {
    $("#item" + i).remove();
}

function CallWebMethod(data, method, callback) { //if no parameters, set data = null
    $.ajax({
        type: 'POST',
        url: method,
        data: data,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        async: "true",
        cache: "false",
        success: function (raw) {
            if (raw.d || raw.d === 0) {
                callback(raw.d);
            } else {
                console.error("Server did not return data for " + method);
            }
        },
        error: function (e) {
            console.log(e);
        }
    });
}