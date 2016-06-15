/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var appendToBody = "$(\"body\").append('<span class=\"iab\"></span>')";
var csrf;
var imageToBeSent;
var laraval;
var pushNotification;
var uploadPictureForm = '<div id="back_to_iab" class="btn btn-primary btn-xs convert-type-btn" style="border-color: #000000;background-color: #284296;">Choose Photo</div>' +
                        '<div id="cancel_photo_upload" class="btn btn-primary btn-xs convert-type-btn" style="border-color: #000000">Cancel</div>';
var previewImage = '<img id="preview_image" style="width:60px;height:60px;" src="" >';
var userId;



var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },

    // Bind Event Listeners
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');

        //GET IMAGE
        $('body').on('click', '#back_to_iab', function(){

            getImage('library');

        });

        //SEND IMAGE
        $('body').on('click', '#confirm_photo', function(){

            sendImage();

        });

        //CANCEL IMAGE SELECTION
        $('body').on('click', '#cancel_photo_upload', function(){

            returnIab();

        });


    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {

        //INITIALIZE VARS
        var model = device.model;
        var platform = device.platform;
        var pushNotification;
        var pushProvider;
        var regId = '';
        userId = 0;

        //determine push provider via platform
        if(platform == 'Android'){
            pushProvider = 'GCM';
        }else{
            pushProvider = 'APNS';
        }


        //OPEN SPLASH
        //navigator.screen.show();

        //1: OPENS laraval INAPP BROWSER
        laraval = cordova.InAppBrowser.open("https://dev.laraval.com/m", "_blank", "location=no,toolbar=no");

        //add the mobile app flag to localstorage
        laraval.addEventListener('loadstop', function(event){
            if(event.url == 'https://dev.laraval.com/m'){
                laraval.executeScript({
                    code: "localStorage.setItem( 'iab_flag', 'yes' );"
                });
            }

        });

        //LISTEN FOR CUSTOM PHOTO UPLOAD URL TO SHOW PHONEGAP PHOTO UPLOAD VIEW
        laraval.addEventListener('loadstop', function(event){
            if(event.url == 'https://dev.laraval.com/phonegapphotoview'){

                laraval.close();
                $('#deviceready').html(uploadPictureForm);

            }
        });


        //LISTEN IF USER GOES TO PROFILE EDIT THEN INJECT SPECIAL SPAN INTO LARAVEL DOM
        laraval.addEventListener('loadstop', function(event) {
            if(event.url == 'https://dev.laraval.com/profile'){

                laraval.execScript({
                    code: appendToBody
                })

            }
        });


        //2: GET USER ID BY POLLING LOCALSTORAGE
        //On the server side, once the user logins in successfully, Sentry::getUser()->id should be written to localstorage
        var loop = setInterval(function () {
            laraval.executeScript(
                {
                    code: "localStorage.getItem( 'userId' )"
                },
                function (values) {
                    userId = parseInt(values[0]);
                    if (userId > 0) {

                        window.localStorage.setItem('user_id', userId);


                        //3: GET REGISTRATION ID FOR PUSH NOTIFICATIONS
                        //if we find it then we are done, if not then we get from provider, send to backend for storage, and also set in localStorage
                        laraval.executeScript(
                            {
                                code: "localStorage.getItem( 'regId' )"
                            },
                            function( values ) {
                                regId = values[ 0 ];
                                if ( regId == null) {




                                    //4: REGISTER WITH PROVIDER AND GET REG ID FOR storage
                                    //ANDROID
                                    if(pushProvider == 'GCM'){

                                        //initialize for registration
                                        pushNotification = PushbotsPlugin.initialize("############", {"android": {"sender_id": "###########"}});

                                        //6: STORE REGISTRATION INFO IN THE BACKEND
                                        pushNotification.on("registered", function (token) {


                                            //build the registration js object
                                            var regisrationDataObj = {
                                                type: "device_registration",
                                                user_id: userId,
                                                device_model: model,
                                                push_reg_num: token,
                                                push_provider: pushProvider
                                            };

                                            //get JSON from object
                                            var registrationDataJson = JSON.stringify(regisrationDataObj);

                                            //send to server for storage
                                            try {
                                                $.ajax({
                                                    type: 'GET',
                                                    data: {registrationdata: registrationDataJson},
                                                    //async: false,
                                                    url: 'https://dev.laraval.com/push_reg',
                                                    success: function (data) {
                                                        //alert("Your device has been successfully registered for push notifications with device id of: " + data);
                                                    },
                                                    error: function () {
                                                        //alert('There was an error registering your device');
                                                    }
                                                });
                                            } catch (err) {
                                                //alert('Error when attempting to register your device for push notifications');
                                            }


                                            //save registration id to localstorage
                                            laraval.executeScript(
                                                {
                                                    code: "localStorage.setItem('regId'," + token + ")"
                                                }
                                            );


                                            console.log(token);
                                        });
                                    }


                                    //IOS
                                    if(pushProvider == 'APNS'){

                                        alert("apple");

                                        navbar.create();
                                        navbar.hideLeftButton()
                                        navbar.hideRightButton();
                                        navbar.setupRightButton("", 'barButton:Refresh', null);
                                        navbar.showRightButton();
                                        navbar.settitle("Tab 1");
                                        navbar.show();

                                        var draweritems = [];
                                        draweritems.push(["Page1","index.html","icon.png", "im the badge"]);
                                        draweritems.push(["Page2","index2.html","", "no badge"]);
                                        draweritems.push(["Page3","index3.html","", null]);
                                        navbar.setupDrawer(draweritems, "#ffffff");

                                        alert("after_apple");

                                    }



                                    //NOTIFICATION RECEIVED
                                    pushNotification.on("notification:received", function(data){

                                        //alert("notification = " + JSON.stringify(data));

                                        //DO SOMETHING WITH RECEIVED NOTIFICATIONS HERE
                                        //data is any string we want that is set in data payload array in laraval
                                        //example: data.message or data.userFirstName

                                    });




                                    //NOTIFICATION CLICKED
                                    pushNotification.on("notification:clicked", function(data){

                                        //DO SOMETHING WITH RECEIVED NOTIFICATIONS HERE
                                        //data is any string we want that is set in data payload array in laraval
                                        //example: data.message or data.userFirstName

                                    });


                                    //GET REGISTRATION ID
                                    pushNotification.getRegistrationId(function(token) {

                                        //alert("on getRegistrationId.  regId = " + token);


                                        //build the registration js object
                                        var regisrationDataObj = {
                                            type: "device_registration",
                                            user_id: userId,
                                            device_model: model,
                                            push_reg_num: token,
                                            push_provider: pushProvider
                                        };

                                        //get JSON from object
                                        var registrationDataJson = JSON.stringify(regisrationDataObj);


                                        //send to server for storage
                                        try {
                                            $.ajax({
                                                type: 'GET',
                                                data: {registrationdata: registrationDataJson},
                                                //async: false,
                                                url: 'https://dev.laraval.com/push_reg',
                                                success: function (data) {
                                                    //alert("Your device has been successfully registered for push notifications with device id of: " + data);
                                                },
                                                error: function () {
                                                    //alert('There was an error registering your device');
                                                }
                                            });
                                        }catch (err){
                                            //alert('Error when attempting to register your device for push notifications');
                                        }



                                    });




                                }
                            }
                        );
                        clearInterval(loop);
                    }
                }
            );
        });






        console.log('Received Event: ' + id);
    }






};




//////LISTENERS//////
//TAKE TO ALTERNATE IN-APP VIEW FOR PHOTO UPLOAD
laraval.addEventListener('loadstart', function(event) {



    if(event.url == 'https://dev.laraval.com/profile'){

        laraval.executeScript(
            {
                code: "localStorage.getItem( 'csrf' )"
            },
            function(values){
                csrf = values[0];

            }
        );

    }


});






function getImage(){

    // Retrieve image file location from specified source
    navigator.camera.getPicture(uploadPhoto, function(message) {
        },{

            quality: 50,
            destinationType: navigator.camera.DestinationType.FILE_URI,
            sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY
        }
    );

}




function getImage(src) {


    src = (src == 'library') ? Camera.PictureSourceType.PHOTOLIBRARY : Camera.PictureSourceType.CAMERA;
    navigator.camera.getPicture(success, fail, {quality: 100, destinationType : Camera.DestinationType.DATA_URL, sourceType: src, targetWidth: 700, targetHeight: 700, correctOrientation : true});

    function success(imageData) {

        //assign image data to global
        imageToBeSent = imageData;

        //format image for displaying
        var imageStr = "data:image/jpeg;base64," + imageData;

        //change view
        $('#deviceready').html('<img id="preview_image" style="width:180px;margin-top: -150px;" src=' + imageStr + ' >' +
                               '<div id="back_to_iab" class="btn btn-primary btn-xs convert-type-btn" style="border-color: #000000">Choose Another</div>' +
                               '<div id="confirm_photo" class="btn btn-primary btn-xs convert-type-btn" style="background-color: #284296;color: #ffffff;border-color: #000000">OK</div>' +
                               '<div id="cancel_photo_upload" class="btn btn-primary btn-xs convert-type-btn" style="border-color: #000000">Cancel</div>');

    }

    function fail(error){
        alert('Error uploading photo');
    }

    function getBase64Image(img) {

        // Create an empty canvas element
        var canvas = document.createElement("canvas");

        // Copy the image contents to the canvas
        var ctx = canvas.getContext("2d");

        //use this block to not draw image unless image is loaded
        var callback = function(image) {
            if(!image) image = this;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(image, 0, 0);
        }

        //check if image is loaded
        if(img.complete) {
            callback(img);
        }else {
            img.onload = callback;
        }

        //get the data-URL formatted image
        var dataURL = canvas.toDataURL("image/png");

        return dataURL;

    }





}





function sendImage(){


    userId = window.localStorage.getItem("user_id");


    var url = 'https://dev.laraval.com/profile/update/picture';
    var params = {photo: 'image/png;space,' + imageToBeSent, user_id: userId};



    $.ajax({
        url: url,
        type: 'POST',
        dataType: 'json',
        data: params,
        headers: {"x-csrf-token": 'notoken'},
        async: false,
        success: function(res)
        {
            if(res.success)
            {
                returnIab();
            }

        },
        complete: function(res)
        {
        },
        error: function(res)
        {
            alert("Error = " + JSON.stringify(res));
        }
    });



}





function returnIab(){

    laraval = cordova.InAppBrowser.open("https://dev.laraval.com/m", "_blank", "location=no,toolbar=no");

}






function uploadPhoto(imageURI){

    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
    options.mimeType="image/jpeg";

    var params = new Object();
    params.value1 = "test";
    params.value2 = "param";

    options.params = params;
    options.chunkedMode = false;

    var ft = new FileTransfer();
    ft.upload(imageURI, "https://dev.laraval.com/profile/update/picture", win, fail, options);

}





function win(r){
    console.log("Code = " + r.responseCode);
    console.log("Response = " + r.response);
    console.log("Sent = " + r.bytesSent);
    alert(r.response);

}




function fail(error){
    alert("Error uploading image with error code: " + error.code);
}
