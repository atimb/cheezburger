$(document).ready(function() {

    // Display message that it is a mobile app
    if (navigator.userAgent.toLowerCase().indexOf('mobile') == -1) {
        alert('This is a mobile game.\nPlease open the URL from your Android Ice Cream Sandwich or (preferably) iPhone 4S !');
        return;
    }
    
	// Display a message asking to add the app to the Home Screen
    if (navigator.userAgent.indexOf('iPhone') != -1) {
    	if (!navigator.standalone == true) {
    		$('#add').show();
    		$('#play').hide();
    	}
    }
    
    // Try to hide the address bar
    setTimeout(function () {
      window.scrollTo(0, 1);
    }, 1000);
    
    // Prevent body scroll, to behave more native
    $('body').bind('touchmove', function() {
        event.preventDefault() ;
    });
    
    // Handset location
    var position = null;
    // Score
    var points = 0;
    // Handset acceleration sensor data
    var acceleration = { x: 0, y: -10, z: 0 };
    
    // Start collection
    window.ondevicemotion = function(event) {
        acceleration = event.accelerationIncludingGravity;
    };
    
    // Bind touch/click events to buttons
    (function bindHandlers() {
        $('.burger').bind('touchend', showSubmitScore);
        $('#play').bind('click', showInGame);
        $('#replay').bind('touchend', showInGame);
        $('#submit').bind('touchend', function() {
            $('#submit').attr('disabled', 'disabled');
            $.post('/api/score', { location: $('#location').val(), nickname: $('#nickname').val(), points: points }, function(res) {
                showHighScore();
            });
        });
    })();
    
    // Show the in-game panel
    function showInGame() {
        $('#banner').hide();
        $('#highscore').hide();
        $('#ingame').show();
        startGame();
    };
    
    // Main game logic here
    function startGame() {
    
        var lastTime = 0;
        var nextBurger = 0;
        var burgerId = 0;
        var burgerz = [];
        var lives = 5;
        points = 0;
        
        var height = $('.cat').offset().top;
        
        lastTime = new Date().getTime();
        animate();
    
        // Check if new burger is needed, add if necessary
        function addBurger(dt) {
            nextBurger -= dt;
            if (nextBurger < 0) {
                // new burger pops up
                burgerz.push({ x: Math.random()*260, y: -50, vx: 0, vy: 0, m: 0.5 + Math.random(), id: burgerId });
                $('<img id="burger-' + burgerId++ + '" src="img/burger.png" class="burger"/>').appendTo('#ingame');
                nextBurger = Math.random()*2000 + 1000;
            }
        }

        // Proccess game mechanics
        function animate() {
           var newTime = new Date().getTime();
           var dt = newTime - lastTime;
           addBurger(dt);

           var newburgerz = [];
           // for all burger on the map
           burgerz.forEach(function(burger) {
               // some simple physics
               var angle = Math.atan(acceleration.x / acceleration.y) * 180 / Math.PI;
               burger.vx = acceleration.x * dt * 0.001 / burger.m;
               burger.vy = -acceleration.y * dt * 0.001  / burger.m;
               burger.x += dt * burger.vx;
               burger.y += dt * burger.vy;
               if (burger.x < 0) {
                   burger.x = 0;
               } else if (burger.x > 260) {
                   burger.x = 260;
               }
               // modify the DOM accordingly
               $('#burger-'+burger.id).css('-webkit-transform', 'translate('+burger.x+'px, '+burger.y+'px) rotate('+angle+'deg) scale('+burger.m+','+burger.m+')');
               // if burger touched the ground, remove it, decrease LIFES, some animation
               if (burger.y > height+100) {
                   $('#burger-'+burger.id).remove();
                   lives--;
                   if (lives === 0) {
                       $('.burger').remove();
                       showSubmitScore();
                   }
                   $('#lives').html('Lives: ' + lives).addClass('bump');
                   setTimeout(function() {
                       $('#lives').removeClass('bump');
                   }, 100);
               // if burger is at the cat's head, remove it, add POINTS, some animation
               } else if (burger.y > height-40 && burger.y < height+20 && burger.x < 160 && burger.x > 100) {
                   $('#burger-'+burger.id).addClass('shrink');
                   setTimeout(function() {
                       $('#burger-'+burger.id).remove();
                   }, 300);
                   points += Math.round(burger.m * 10);
                   $('#points').html('Score: ' + points).addClass('bump');
                   setTimeout(function() {
                       $('#points').removeClass('bump');
                       $('.cat').removeClass('jump');
                   }, 10);
                   $('.cat').addClass('jump');
               } else {
                   // otherwise the burger survives to the next round
                   newburgerz.push(burger);
               }
           });
           burgerz = newburgerz;

           lastTime = newTime;
           if (lives > 0) {
               requestAnimFrame(animate);
           }
        }
    }
    
    // Show the submit score panel
    function showSubmitScore() {
        $('#ingame').hide();
        $('#submitscore').show();
        $('#submit').removeAttr('disabled');
        $('#score').html(points + ' points');

        // Retrieve accounts (locations)
        $.get('/api/locations', function(locations) {
            var fillSelect= function() {
                // Sort according to GPS coord distance to user
                if (position) {
                    locations.sort(function(a, b) {
                        var distA = Math.pow(a.lat - position.lat, 2) + Math.pow(a.long - position.long, 2);
                        var distB = Math.pow(b.lat - position.lat, 2) + Math.pow(b.long - position.long, 2);
                        return distA - distB;
                    });
                }
                locations.forEach(function(el) {
                    $('<option/>', { 'value': el.id }).text(el.name).appendTo('#location');
                });
            }
            // Try to get physical coordinates
            if (typeof(navigator.geolocation.getCurrentPosition) === 'function' && !position) {
                navigator.geolocation.getCurrentPosition(function(position){
                    position = position.coords;
                    fillSelect();
                });
            } else {
                fillSelect();
            } 
        });
    };
    
    // Show the high score panel
    function showHighScore() {
        $('#submitscore').hide();
        $('#highscore').show();
        $('#highscores').html('<span>loading...</span>');
        
        // Retrieve high scores for this location, and display
        $('#highscorefor').html('for ' + $('#location option:selected').text());
        $.get('/api/highscore/' + $('#location').val(), function(best) {
            $('#highscores').html('');
            best.forEach(function(el, i) {
                $('#highscores').append('<span>' + (i+1) + '.</span> ' + el.name + ', <i>' + el.points + '</i><br />');
            });
        });
    }
    
});

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();
