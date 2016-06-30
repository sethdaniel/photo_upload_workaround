<?php

/*
|--------------------------------------------------------------------------
| Application & Route Filters
|--------------------------------------------------------------------------
|
| Below you will find the "before" and "after" events for the application
| which may be used to do any work before or after a request into your
| application. Here you may also register your custom route filters.
|
*/

App::before(function($request)
{

    //map old urls to new ones
    $urls = ['stage.laravel.com'=>'https://portal24240.laravel.com','beta.laravel.com'=>'https://portal.laravel.com'];
    if (isset($urls[$_SERVER['HTTP_HOST']])){
        return Redirect::to($urls[$_SERVER['HTTP_HOST']].$_SERVER['REQUEST_URI']);
    }
    //redirect if we're not on https
    //todo: This won't work on forge servers (it doesn't even hit here)
    if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] != 'on'){
        return Redirect::to('https://'.$_SERVER['HTTP_HOST']);
    }

    //SETUP LOGGER

    //start clockwork
    Event::fire('clockwork.controller.start');

    // Set the format
    $output = "%channel%.%level_name%: %message%";
    $formatter = new Monolog\Formatter\LineFormatter($output);

    // Setup the logger
    $logger = Log::getMonolog();
    $syslogHandler = new Monolog\Handler\SyslogUdpHandler("logs4.papertrailapp.com", '20349');
    $syslogHandler->setFormatter($formatter);
    $logger->pushHandler($syslogHandler);

});


App::after(function($request, $response)
{
    Event::fire('clockwork.controller.end');
});

/*
|--------------------------------------------------------------------------
| Authentication Filters
|--------------------------------------------------------------------------
|
| The following filters are used to verify that the user of the current
| session is logged into this application. The "basic" filter easily
| integrates HTTP Basic authentication for quick, simple checking.
|
*/

Route::filter('auth', function()
{
    if (!Sentry::check())
    {
        if( Request::ajax() ) {

            header("REQUIRES_AUTH: 1");
            exit();
        }

        //if accessing a specific page redirect to it
        $url = Request::fullUrl();

        if($url != 'login' || $url != 'profile' || $url != '') {
            Session::put('redirect',$url);
        }

        //don't show login message if on homepage (it's annoying lots of people try to access login page via home)
        if (Request::is('/') || Request::is('')){
            return Redirect::route('login');
        }

        return Redirect::route('login');

    }
    /**
     * Admins can lock a user out of the site
     * todo: currently this has maintenance message. We might want to add a way for custom messages later..
     */
    if (Sentry::getUser()->in_admin_lockout){
        return Redirect::to('/locked-out');
    }

    /**
     * CHECK CSRF TOKEN (For certain methods)
     * Doing this here allows us to make sure the user was authenticated first
     * if the user's session has expired then their token will definitely be expired (so we don't even need to check and error wouldn't be correct)
     */
    if (in_array(strtolower(Request::method()), ['post','put','delete'])) {

        if(Request::header('x-csrf-token') == 'notoken'){

            //do nothing

        }else {

            if (Request::ajax()) {
                if (Session::token() !== Request::header('x-csrf-token')) {
                    // TODO: Change this to return something that JavaScript can read...
                    throw new Illuminate\Session\TokenMismatchException;
                }
            } elseif (Session::token() !== Input::get('_token')) {
                throw new Illuminate\Session\TokenMismatchException;
            }
        }
    }
});

if(Sentry::check())
{
    View::composer('layouts.main',function($view)
    {
        $view->with('user',Sentry::getUser());
    });
}


Route::filter('auth.basic', function()
{
    return Auth::basic();
});

/*
|--------------------------------------------------------------------------
| Admin Filter
|--------------------------------------------------------------------------
|
*/

Route::filter('isAdmin', function()
{
    $user = Sentry::getUser();
    if(!$user){
        return Redirect::route('login');
    }
    if(!$user->is_admin){
        return Redirect::to('profile')->with('message', 'Can not access this');
    }
});

/*
|--------------------------------------------------------------------------
| Guest Filter
|--------------------------------------------------------------------------
|
| The "guest" filter is the counterpart of the authentication filters as
| it simply checks that the current user is not logged in. A redirect
| response will be issued if they are, which you may freely change.
|
*/

Route::filter('guest', function()
{
    if (Sentry::check()) return Redirect::to('/');
});

/*
|--------------------------------------------------------------------------
| CSRF Protection Filter
|--------------------------------------------------------------------------
|
| The CSRF filter is responsible for protecting your application against
| cross-site request forgery attacks. If this special token in a user
| session does not match the one given in this request, we'll bail.
|
*/

Route::filter('csrf', function()
{
    /**
     * NOTE: We're doing this in auth filter
     * you can add back here if we need it in another location.
     * If you need for login, you can add, but I recommend refreshing the login screen to prevent token expiration errors
     */

});


/*
|--------------------------------------------------------------------------
| Login required to continue
|--------------------------------------------------------------------------
|
| The user will have to be logued in in order to continue.
|
|
*/

/**
 * Used for hack to skip profile complete
 * put out here because profileComplete filter not always called
 */
if (Input::has('LQr@xSKIPComplete')){
    Session::set('skippc',true);
}

Route::filter('profileComplete',function()
{
    $user = Sentry::getUser();

    /**
     * ALLOW HACK TO SKIP PROFILE COMPLETE
     * (note, this is also used to skip cliet side validation on profile editing)
     * This is useful for admins
     */
    $canSkip = false;
    if (Session::has('skippc') && Session::get('skippc')){
        $canSkip = true;
    }
    if(!$user->is_profile_complete)
    {
        if (!$canSkip){
            return Redirect::to('profile.complete')->with('message','Please complete your profile before proceeding');
        }
    }
});

Route::filter('isAdmin', function()
{
    $user = Sentry::getUser();
    if(!$user){
        return Redirect::route('login');
    }
});

























