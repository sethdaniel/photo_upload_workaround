<script type="text/javascript">

////SPECIAL URL FOR USERS ON MOBILE APP TAPPING TO CHANGE PICTURE////
//Strategy:
//1. Phonegap user browses to edit profile page where the photo upload will not work in the normal way.
//2. As soon as the edit profile page is loaded, Phonegap stores a flag in local storage
//3. When the user taps the photo to change it, Laravel checks for this flag.
//4. If Laravel finds it then Laravel knows to redirect to custom, empty url.
//5. inappbrowser in Phonegap is listening for that custom url.
//6. When Phonegap hears that custom url it shuts down inappbrowser and presents the user with an in-app view for uploading photos.
//7. Since the image is coming from inappbrowser it would normally get rejected due to csrf mismatch but added exception in filters.php
//8. After selecting and approving new photo, user is taken back to inappbrowser.
$(document).on('ready', function(){

  //listen for photo change element tap
  $('#profile-img').click(function(){

    //check to make sure that iab span exists
    if(localStorage.getItem('iab_flag') == 'yes'){

      $('#choose_image').click(function(e){
        e.preventDefault();

        //redirect to custom url
          window.location = '/phonegapphotoview';

      });

    }

  });

});

</script>
